import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  engagementKindForType,
  fetchEngagementAlertPrefs,
  isEngagementAlertEnabled,
} from "@/lib/alerts/engagement-preferences";
import { maybeSendInstantNotificationEmail } from "@/lib/email/instant";
import { isPermanentNotificationType } from "@/lib/notifications/catalog";
import { isWatchlistPushType, type NotificationType } from "@/lib/notifications/types";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  refCallId?: string | null;
  actorUserId?: string | null;
};

function deliverSideEffects(input: CreateNotificationInput): void {
  void maybeSendInstantNotificationEmail({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
  });

  if (!isWatchlistPushType(input.type)) return;

  void import("@/lib/push/watchlist-push").then(({ maybeSendWatchlistPush }) =>
    maybeSendWatchlistPush({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    })
  );
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (input.userId === input.actorUserId) return;
  if (isDemoMode()) return;

  if (!isPermanentNotificationType(input.type)) {
    const engagementKind = engagementKindForType(input.type);
    if (engagementKind) {
      const engagementPrefs = await fetchEngagementAlertPrefs(input.userId);
      if (!isEngagementAlertEnabled(engagementPrefs, engagementKind)) return;
    }
  }

  const db = createServiceClient();

  if (input.type === "vote_on_call" && input.refCallId && input.actorUserId) {
    const since = new Date(Date.now() - 24 * 3600000).toISOString();
    const { data: existing } = await db
      .from("user_notifications")
      .select("id")
      .eq("user_id", input.userId)
      .eq("type", "vote_on_call")
      .eq("ref_call_id", input.refCallId)
      .eq("actor_user_id", input.actorUserId)
      .gte("created_at", since)
      .limit(1);
    if (existing?.length) return;
  }

  const { error } = await db.from("user_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    ref_call_id: input.refCallId ?? null,
    actor_user_id: input.actorUserId ?? null,
  } as never);

  if (error) {
    console.error("[notifications/create]", error);
    return;
  }

  deliverSideEffects(input);
}
