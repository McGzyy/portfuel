import { createServiceClient } from "@/lib/db/supabase";
import type { NotificationType } from "@/lib/notifications/types";

export type EmailPrefs = {
  notifyEmail: string | null;
  emailInstantEnabled: boolean;
  emailDigestEnabled: boolean;
  emailProBriefEnabled: boolean;
  marketingMemberOptIn: boolean;
  marketingProOptIn: boolean;
};

export async function fetchEmailPrefs(userId: string): Promise<EmailPrefs | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select(
      "notify_email, email_instant_enabled, email_digest_enabled, email_pro_brief_enabled, marketing_member_opt_in, marketing_pro_opt_in"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    notify_email: string | null;
    email_instant_enabled: boolean;
    email_digest_enabled: boolean;
    email_pro_brief_enabled?: boolean;
    marketing_member_opt_in?: boolean;
    marketing_pro_opt_in?: boolean;
  };

  return {
    notifyEmail: row.notify_email,
    emailInstantEnabled: row.email_instant_enabled,
    emailDigestEnabled: row.email_digest_enabled,
    emailProBriefEnabled: row.email_pro_brief_enabled ?? true,
    marketingMemberOptIn: Boolean(row.marketing_member_opt_in),
    marketingProOptIn: Boolean(row.marketing_pro_opt_in),
  };
}

const INSTANT_EMAIL_TYPES: NotificationType[] = [
  "watchlist_call",
  "watchlist_price_move",
  "watchlist_earnings",
  "watchlist_plan_level",
  "comment_on_call",
  "vote_on_call",
  "followed_member_call",
  "new_follower",
  "desk_portfolio_update",
  "call_milestone",
  "direct_message",
  "support_ticket_opened",
  "support_ticket_reply",
  "support_ticket_idle_warning",
  "support_ticket_status",
  "billing_payment_failed",
];

export function shouldSendInstantEmail(
  type: NotificationType,
  prefs: EmailPrefs
): boolean {
  if (!prefs.notifyEmail?.trim()) return false;
  if (!prefs.emailInstantEnabled) return false;
  return INSTANT_EMAIL_TYPES.includes(type);
}
