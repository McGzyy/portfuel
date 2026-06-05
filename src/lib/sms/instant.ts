import { fetchUserAlertPrefs } from "@/lib/alerts/preferences";
import { canAccessProIntelligence, type ProAccessContext } from "@/lib/features/pro-intelligence";
import { isSmsConfigured } from "@/lib/sms/config";
import { sendPortfuelSms } from "@/lib/sms/send";
import type { NotificationType } from "@/lib/notifications/types";
import { WATCHLIST_ALERT_NOTIFICATION_TYPES } from "@/lib/notifications/types";

const SMS_WATCHLIST_TYPES: NotificationType[] = WATCHLIST_ALERT_NOTIFICATION_TYPES;

export async function maybeSendInstantWatchlistSms(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  proContext: ProAccessContext;
}): Promise<void> {
  if (!isSmsConfigured()) return;
  if (!SMS_WATCHLIST_TYPES.includes(opts.type)) return;
  if (!canAccessProIntelligence(opts.proContext)) return;

  const prefs = await fetchUserAlertPrefs(opts.userId);
  if (!prefs?.smsAlertsEnabled || !prefs.smsPhoneE164) return;

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://portfuel.com";
  const path = opts.href.startsWith("/") ? opts.href : `/${opts.href}`;
  const text = `PortFuel: ${opts.title} — ${opts.body} ${site}${path}`;

  await sendPortfuelSms({ to: prefs.smsPhoneE164, body: text });
}
