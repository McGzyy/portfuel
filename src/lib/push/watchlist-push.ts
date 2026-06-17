import {
  fetchUserAlertPrefs,
  isWatchlistAlertTypeEnabled,
} from "@/lib/alerts/preferences";
import {
  getVapidPrivateKey,
  getVapidPublicKey,
  getVapidSubject,
  isPushConfigured,
} from "@/lib/push/config";
import {
  deletePushSubscriptionById,
  fetchUserPushSubscriptions,
  isPushAlertsEnabled,
} from "@/lib/push/subscriptions";
import { isWatchlistPushType, type NotificationType } from "@/lib/notifications/types";

function prefKindForType(
  type: NotificationType
): "price_move" | "earnings" | "plan_levels" | "community_calls" | null {
  if (type === "watchlist_price_move") return "price_move";
  if (type === "watchlist_earnings") return "earnings";
  if (type === "watchlist_plan_level") return "plan_levels";
  if (type === "watchlist_call") return "community_calls";
  return null;
}

export async function maybeSendWatchlistPush(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
}): Promise<void> {
  if (!isPushConfigured() || !isWatchlistPushType(opts.type)) return;

  const enabled = await isPushAlertsEnabled(opts.userId);
  if (!enabled) return;

  const prefs = await fetchUserAlertPrefs(opts.userId);
  if (!prefs) return;

  const kind = prefKindForType(opts.type);
  if (kind && !isWatchlistAlertTypeEnabled(prefs.watchlist, kind)) return;

  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  if (!publicKey || !privateKey) return;

  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);

  const subs = await fetchUserPushSubscriptions(opts.userId);
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: opts.title,
    body: opts.body,
    href: opts.href,
  });

  await Promise.all(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          payload
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await deletePushSubscriptionById(row.id);
        } else {
          console.error("[push/send]", row.endpoint.slice(0, 48), e);
        }
      }
    })
  );
}
