import { createServiceClient } from "@/lib/db/supabase";
import type { NotificationType } from "@/lib/notifications/types";

export type EmailPrefs = {
  notifyEmail: string | null;
  emailInstantEnabled: boolean;
  emailDigestEnabled: boolean;
};

export async function fetchEmailPrefs(userId: string): Promise<EmailPrefs | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("notify_email, email_instant_enabled, email_digest_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    notify_email: string | null;
    email_instant_enabled: boolean;
    email_digest_enabled: boolean;
  };

  return {
    notifyEmail: row.notify_email,
    emailInstantEnabled: row.email_instant_enabled,
    emailDigestEnabled: row.email_digest_enabled,
  };
}

const INSTANT_EMAIL_TYPES: NotificationType[] = [
  "watchlist_call",
  "comment_on_call",
  "followed_member_call",
  "desk_portfolio_update",
];

export function shouldSendInstantEmail(
  type: NotificationType,
  prefs: EmailPrefs
): boolean {
  if (!prefs.notifyEmail?.trim()) return false;
  if (!prefs.emailInstantEnabled) return false;
  return INSTANT_EMAIL_TYPES.includes(type);
}
