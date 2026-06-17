import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { maybeEnhanceWatchlistAlertBody, type JournalAlertKind } from "@/lib/ai/journal-alert";
import { maybeSendInstantNotificationEmail } from "@/lib/email/instant";
import { maybeSendInstantWatchlistSms } from "@/lib/sms/instant";
import type { NotificationType } from "@/lib/notifications/types";
import { WATCHLIST_ALERT_NOTIFICATION_TYPES } from "@/lib/notifications/types";
import type { MembershipTier } from "@/lib/stripe/config";
import type { ProAccessContext } from "@/lib/features/pro-intelligence";

export type DispatchWatchlistAlertInput = {
  userId: string;
  type: (typeof WATCHLIST_ALERT_NOTIFICATION_TYPES)[number];
  title: string;
  body: string;
  href: string;
  symbol: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  proContext: ProAccessContext;
  aiInsightsEnabled: boolean;
  journalContext?: {
    thesis?: string | null;
    conviction?: number | null;
    entryPrice?: number | null;
    stopPrice?: number | null;
    targetPrice?: number | null;
  };
  journalKind?: JournalAlertKind;
};

function mapNotificationKind(type: NotificationType): JournalAlertKind {
  if (type === "watchlist_earnings") return "earnings";
  if (type === "watchlist_plan_level") return "plan_level";
  return "price_move";
}

export async function dispatchWatchlistAlert(input: DispatchWatchlistAlertInput): Promise<void> {
  if (isDemoMode()) return;

  let body = input.body;
  if (input.aiInsightsEnabled && input.journalContext) {
    body = await maybeEnhanceWatchlistAlertBody({
      userId: input.userId,
      membershipTier: input.membershipTier,
      role: input.role,
      symbol: input.symbol,
      kind: input.journalKind ?? mapNotificationKind(input.type),
      baseBody: input.body,
      aiInsightsEnabled: true,
      ...input.journalContext,
    });
  }

  const db = createServiceClient();
  const { error } = await db.from("user_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body,
    href: input.href,
  } as never);

  if (error) {
    console.error("[alerts/dispatch]", error);
    return;
  }

  void maybeSendInstantNotificationEmail({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body,
    href: input.href,
  });

  void maybeSendInstantWatchlistSms({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body,
    href: input.href,
    proContext: input.proContext,
  });

  void import("@/lib/push/watchlist-push").then(({ maybeSendWatchlistPush }) =>
    maybeSendWatchlistPush({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body,
      href: input.href,
    })
  );
}

export async function recordAlertSent(opts: {
  userId: string;
  symbol: string;
  alertKind: string;
  refKey: string;
}): Promise<void> {
  if (isDemoMode()) return;

  const db = createServiceClient();
  await db.from("watchlist_alert_sent").upsert(
    {
      user_id: opts.userId,
      symbol: opts.symbol.toUpperCase(),
      alert_kind: opts.alertKind,
      ref_key: opts.refKey,
      created_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id,alert_kind,ref_key" }
  );
}

export async function wasAlertSent(opts: {
  userId: string;
  alertKind: string;
  refKey: string;
}): Promise<boolean> {
  if (isDemoMode()) return false;

  const db = createServiceClient();
  const { data } = await db
    .from("watchlist_alert_sent")
    .select("ref_key")
    .eq("user_id", opts.userId)
    .eq("alert_kind", opts.alertKind)
    .eq("ref_key", opts.refKey)
    .maybeSingle();

  return Boolean(data);
}
