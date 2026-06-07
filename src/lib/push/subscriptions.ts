import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function fetchUserPushSubscriptions(userId: string): Promise<PushSubscriptionRow[]> {
  if (isDemoMode()) return [];

  const db = createServiceClient();
  const { data, error } = await db
    .from("user_push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("[push/subscriptions/list]", error);
    return [];
  }

  return (data ?? []) as PushSubscriptionRow[];
}

export async function upsertPushSubscription(
  userId: string,
  sub: PushSubscriptionInput,
  userAgent?: string | null
): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const { error } = await db.from("user_push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent ?? null,
    } as never,
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("[push/subscriptions/upsert]", error);
    return { error: "db_error" };
  }

  await db
    .from("users")
    .update({ push_alerts_enabled: true } as never)
    .eq("id", userId);

  return { ok: true };
}

export async function deletePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  if (isDemoMode()) return;

  const db = createServiceClient();
  await db
    .from("user_push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  const { count } = await db
    .from("user_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) === 0) {
    await db
      .from("users")
      .update({ push_alerts_enabled: false } as never)
      .eq("id", userId);
  }
}

export async function deletePushSubscriptionById(id: string): Promise<void> {
  if (isDemoMode()) return;

  const db = createServiceClient();
  const { data } = await db
    .from("user_push_subscriptions")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  await db.from("user_push_subscriptions").delete().eq("id", id);

  const userId = (data as { user_id: string } | null)?.user_id;
  if (!userId) return;

  const { count } = await db
    .from("user_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) === 0) {
    await db
      .from("users")
      .update({ push_alerts_enabled: false } as never)
      .eq("id", userId);
  }
}

export async function isPushAlertsEnabled(userId: string): Promise<boolean> {
  if (isDemoMode()) return false;

  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("push_alerts_enabled")
    .eq("id", userId)
    .maybeSingle();

  return Boolean((data as { push_alerts_enabled?: boolean } | null)?.push_alerts_enabled);
}
