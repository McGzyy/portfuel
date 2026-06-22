import { createServiceClient } from "@/lib/db/supabase";
import { effectiveHasProIntelligence } from "@/lib/billing/effective-access";
import { sendPortfuelEmail } from "@/lib/email/client";
import { isEmailConfigured } from "@/lib/email/config";
import type { DigestSection } from "@/lib/email/digest-content";
import { proMorningBriefEmail } from "@/lib/email/templates";
import { loadProTodayBriefForUser } from "@/lib/pro/brief-for-user";
import type { ProTodayBrief } from "@/lib/pro/today-brief";
import { briefTitleForHour } from "@/lib/time/greeting";

const MIN_SEND_INTERVAL_MS = 20 * 3600 * 1000;

export type ProBriefRunResult = {
  attempted: number;
  sent: number;
  skipped: number;
};

export function proBriefToEmailSections(brief: ProTodayBrief): DigestSection[] {
  return brief.rows.map((row) => ({
    heading: row.title,
    lines: [row.detail, row.meta].filter((line): line is string => Boolean(line)),
  }));
}

export async function runProMorningBriefBatch(): Promise<ProBriefRunResult> {
  if (!isEmailConfigured()) {
    return { attempted: 0, sent: 0, skipped: 0 };
  }

  const db = createServiceClient();
  const nowIso = new Date().toISOString();
  const cutoff = new Date(Date.now() - MIN_SEND_INTERVAL_MS).toISOString();

  const { data: users, error } = await db
    .from("users")
    .select(
      "id, username, display_name, notify_email, email_pro_brief_enabled, email_pro_brief_last_sent_at, subscription_status, membership_tier, pro_granted_until, role"
    )
    .eq("subscription_status", "active")
    .eq("email_pro_brief_enabled", true)
    .not("notify_email", "is", null);

  if (error) {
    console.error("[email/pro-brief/users]", error);
    return { attempted: 0, sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let attempted = 0;

  for (const u of users ?? []) {
    const row = u as {
      id: string;
      username: string;
      display_name: string;
      notify_email: string;
      email_pro_brief_enabled: boolean;
      email_pro_brief_last_sent_at: string | null;
      subscription_status: "pending" | "active" | "cancelled";
      membership_tier: "member" | "pro" | null;
      pro_granted_until: string | null;
      role: "member" | "admin";
    };

    if (
      !effectiveHasProIntelligence({
        role: row.role,
        subscriptionStatus: row.subscription_status,
        membershipTier: row.membership_tier,
        proGrantedUntil: row.pro_granted_until,
      })
    ) {
      continue;
    }

    attempted++;

    if (row.email_pro_brief_last_sent_at && row.email_pro_brief_last_sent_at > cutoff) {
      skipped++;
      continue;
    }

    const ok = await sendProMorningBriefForUser(row.id, row.username, row.display_name);
    if (ok) sent++;
    else skipped++;
  }

  void nowIso;
  return { attempted, sent, skipped };
}

export async function sendProMorningBriefForUser(
  userId: string,
  username: string,
  displayName?: string | null
): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const db = createServiceClient();
  const { data: user, error } = await db
    .from("users")
    .select(
      "display_name, notify_email, email_pro_brief_enabled, subscription_status, membership_tier, pro_granted_until, role"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !user) return false;

  const row = user as {
    display_name: string;
    notify_email: string | null;
    email_pro_brief_enabled: boolean;
    subscription_status: "pending" | "active" | "cancelled";
    membership_tier: "member" | "pro" | null;
    pro_granted_until: string | null;
    role: "member" | "admin";
  };

  if (!row.email_pro_brief_enabled || !row.notify_email?.trim()) return false;
  if (
    !effectiveHasProIntelligence({
      role: row.role,
      subscriptionStatus: row.subscription_status,
      membershipTier: row.membership_tier,
      proGrantedUntil: row.pro_granted_until,
    })
  ) {
    return false;
  }

  const brief = await loadProTodayBriefForUser(userId, username);
  const sections = proBriefToEmailSections(brief);
  const briefTitle = briefTitleForHour(new Date().getUTCHours());
  const name = displayName?.trim() || row.display_name?.trim() || username;

  const tpl = proMorningBriefEmail({
    displayName: name,
    briefTitle,
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
      .update({ email_pro_brief_last_sent_at: new Date().toISOString() } as never)
      .eq("id", userId);
  }

  return ok;
}
