import { createServiceClient } from "@/lib/db/supabase";
import { sendPortfuelEmail } from "@/lib/email/client";
import { isEmailConfigured } from "@/lib/email/config";
import {
  buildWeeklyDigestSections,
  buildWeeklyDigestSnapshot,
} from "@/lib/email/digest-content";
import { weeklyDigestEmail } from "@/lib/email/templates";

const DIGEST_INTERVAL_MS = 7 * 24 * 3600 * 1000;

export type DigestRunResult = {
  attempted: number;
  sent: number;
  skipped: number;
};

export async function runWeeklyDigestBatch(): Promise<DigestRunResult> {
  if (!isEmailConfigured()) {
    return { attempted: 0, sent: 0, skipped: 0 };
  }

  const db = createServiceClient();
  const cutoff = new Date(Date.now() - DIGEST_INTERVAL_MS).toISOString();
  const snapshot = await buildWeeklyDigestSnapshot();

  const { data: users, error } = await db
    .from("users")
    .select(
      "id, display_name, notify_email, email_digest_enabled, email_digest_last_sent_at, calls_count, win_rate, avg_return_pct"
    )
    .eq("subscription_status", "active")
    .eq("email_digest_enabled", true)
    .not("notify_email", "is", null);

  if (error) {
    console.error("[email/digest/users]", error);
    return { attempted: 0, sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const u of users ?? []) {
    const row = u as {
      id: string;
      display_name: string;
      notify_email: string;
      email_digest_last_sent_at: string | null;
      calls_count: number;
      win_rate: number | null;
      avg_return_pct: number | null;
    };

    if (row.email_digest_last_sent_at && row.email_digest_last_sent_at > cutoff) {
      skipped++;
      continue;
    }

    const ok = await sendWeeklyDigestForUser(row.id, snapshot);
    if (ok) sent++;
    else skipped++;
  }

  return { attempted: (users ?? []).length, sent, skipped };
}

export async function sendWeeklyDigestForUser(
  userId: string,
  snapshot?: Awaited<ReturnType<typeof buildWeeklyDigestSnapshot>>
): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const db = createServiceClient();
  const { data: user, error } = await db
    .from("users")
    .select(
      "id, display_name, notify_email, email_digest_enabled, calls_count, win_rate, avg_return_pct"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !user) return false;

  const row = user as {
    display_name: string;
    notify_email: string | null;
    email_digest_enabled: boolean;
    calls_count: number;
    win_rate: number | null;
    avg_return_pct: number | null;
  };

  if (!row.email_digest_enabled || !row.notify_email?.trim()) return false;

  const shared = snapshot ?? (await buildWeeklyDigestSnapshot());
  const sections = await buildWeeklyDigestSections(
    userId,
    {
      calls_count: row.calls_count,
      win_rate: row.win_rate,
      avg_return_pct: row.avg_return_pct,
    },
    shared
  );

  const tpl = weeklyDigestEmail({
    displayName: row.display_name,
    sections,
  });

  const ok = await sendPortfuelEmail({
    to: row.notify_email.trim(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });

  if (ok) {
    await db
      .from("users")
      .update({ email_digest_last_sent_at: new Date().toISOString() } as never)
      .eq("id", userId);
  }

  return ok;
}
