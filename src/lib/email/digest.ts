import { createServiceClient } from "@/lib/db/supabase";
import { sendPortfuelEmail } from "@/lib/email/client";
import { isEmailConfigured } from "@/lib/email/config";
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

    if (
      row.email_digest_last_sent_at &&
      row.email_digest_last_sent_at > cutoff
    ) {
      skipped++;
      continue;
    }

    const ok = await sendWeeklyDigestForUser(row.id);
    if (ok) sent++;
    else skipped++;
  }

  return { attempted: (users ?? []).length, sent, skipped };
}

export async function sendWeeklyDigestForUser(userId: string): Promise<boolean> {
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

  const sections: { heading: string; lines: string[] }[] = [];

  const yourLines: string[] = [];
  if (row.calls_count > 0) {
    yourLines.push(`${row.calls_count} published call${row.calls_count === 1 ? "" : "s"}`);
    if (row.win_rate != null) yourLines.push(`Win rate: ${Math.round(row.win_rate)}%`);
    if (row.avg_return_pct != null) {
      yourLines.push(`Average return: ${Number(row.avg_return_pct).toFixed(1)}%`);
    }
  } else {
    yourLines.push("No calls yet — publish your first thesis from the desk.");
  }
  sections.push({ heading: "Your desk", lines: yourLines });

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: hotCalls } = await db
    .from("calls")
    .select("symbol, direction, return_pct, vote_score, users!inner(username)")
    .gte("created_at", since)
    .order("vote_score", { ascending: false })
    .limit(5);

  const feedLines = (hotCalls ?? []).map((c) => {
    const row = c as {
      symbol: string;
      direction: string;
      return_pct: number | null;
      users: { username: string } | { username: string }[];
    };
    const u = Array.isArray(row.users) ? row.users[0] : row.users;
    const who = u?.username ? `@${u.username}` : "Member";
    const ret =
      row.return_pct != null ? ` · ${Number(row.return_pct).toFixed(1)}%` : "";
    return `${row.symbol} ${row.direction} by ${who}${ret}`;
  });

  sections.push({
    heading: "Hot this week",
    lines: feedLines.length ? feedLines : ["Quiet week — check the feed for new theses."],
  });

  const { count: unread } = await db
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  sections.push({
    heading: "In-app",
    lines: [
      unread && unread > 0
        ? `${unread} unread notification${unread === 1 ? "" : "s"}`
        : "You're caught up on notifications",
    ],
  });

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
