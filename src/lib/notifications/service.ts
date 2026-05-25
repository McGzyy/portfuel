import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { maybeSendInstantNotificationEmail } from "@/lib/email/instant";
import { getDemoNotifications } from "@/lib/notifications/demo";
import type { NotificationType, UserNotification } from "@/lib/notifications/types";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  refCallId?: string | null;
  actorUserId?: string | null;
};

function mapRow(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
  actor?: { username: string } | null;
}): UserNotification {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    href: row.href,
    read_at: row.read_at,
    created_at: row.created_at,
    actor_username: row.actor?.username ?? null,
  };
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (input.userId === input.actorUserId) return;
  if (isDemoMode()) return;

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

  void maybeSendInstantNotificationEmail({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
  });
}

export async function fetchNotifications(
  userId: string,
  limit = 40
): Promise<UserNotification[]> {
  if (isDemoMode()) return getDemoNotifications();

  const db = createServiceClient();
  const { data, error } = await db
    .from("user_notifications")
    .select("id, type, title, body, href, read_at, created_at, actor_user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[notifications/fetch]", error);
    return [];
  }

  const rows = data ?? [];
  const actorIds = [
    ...new Set(rows.map((r) => r.actor_user_id).filter((id): id is string => Boolean(id))),
  ];
  const actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await db.from("users").select("id, username").in("id", actorIds);
    for (const a of actors ?? []) {
      actorMap.set(a.id, a.username);
    }
  }

  return rows.map((row) =>
    mapRow({
      ...row,
      actor: row.actor_user_id ? { username: actorMap.get(row.actor_user_id) ?? "" } : null,
    })
  );
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  if (isDemoMode()) return getDemoNotifications().filter((n) => !n.read_at).length;

  const db = createServiceClient();
  const { count, error } = await db
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("[notifications/unread]", error);
    return 0;
  }
  return count ?? 0;
}

export async function markNotificationsRead(
  userId: string,
  opts: { ids?: string[]; all?: boolean }
): Promise<void> {
  if (isDemoMode()) return;

  const db = createServiceClient();
  const now = new Date().toISOString();

  let query = db
    .from("user_notifications")
    .update({ read_at: now } as never)
    .eq("user_id", userId)
    .is("read_at", null);

  if (!opts.all && opts.ids?.length) {
    query = query.in("id", opts.ids);
  }

  const { error } = await query;
  if (error) console.error("[notifications/markRead]", error);
}

export async function notifyCallComment(opts: {
  callId: string;
  symbol: string;
  callOwnerId: string;
  actorUserId: string;
  actorDisplayName: string | null;
  actorUsername: string;
  commentPreview: string;
}) {
  const preview =
    opts.commentPreview.length > 80
      ? `${opts.commentPreview.slice(0, 77)}…`
      : opts.commentPreview;

  await createNotification({
    userId: opts.callOwnerId,
    type: "comment_on_call",
    title: `New comment on ${opts.symbol}`,
    body: `${opts.actorDisplayName ?? opts.actorUsername}: ${preview}`,
    href: `/ticker/${opts.symbol}`,
    refCallId: opts.callId,
    actorUserId: opts.actorUserId,
  });
}

export async function notifyCallVote(opts: {
  callId: string;
  symbol: string;
  callOwnerId: string;
  actorUserId: string;
  actorUsername: string;
  voteValue: 1 | -1;
}) {
  await createNotification({
    userId: opts.callOwnerId,
    type: "vote_on_call",
    title: `New vote on ${opts.symbol}`,
    body: `@${opts.actorUsername} ${opts.voteValue === 1 ? "upvoted" : "downvoted"} your call`,
    href: `/ticker/${opts.symbol}`,
    refCallId: opts.callId,
    actorUserId: opts.actorUserId,
  });
}

export async function notifyWatchlistNewCall(opts: {
  callId: string;
  symbol: string;
  callerUserId: string;
  callerUsername: string;
  callerDisplayName: string | null;
  direction: string;
}) {
  if (isDemoMode()) return;

  const db = createServiceClient();
  const { data: watchers } = await db
    .from("user_watchlist")
    .select("user_id")
    .eq("symbol", opts.symbol.toUpperCase())
    .neq("user_id", opts.callerUserId);

  const name = opts.callerDisplayName ?? opts.callerUsername;
  for (const w of watchers ?? []) {
    await createNotification({
      userId: w.user_id,
      type: "watchlist_call",
      title: `New call on ${opts.symbol}`,
      body: `${name} published a ${opts.direction} thesis`,
      href: `/ticker/${opts.symbol}`,
      refCallId: opts.callId,
      actorUserId: opts.callerUserId,
    });
  }
}

export async function notifyFollowedMemberNewCall(opts: {
  callId: string;
  symbol: string;
  callerUserId: string;
  callerUsername: string;
  callerDisplayName: string | null;
  direction: string;
}) {
  if (isDemoMode()) return;

  const db = createServiceClient();
  const { data: followers } = await db
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", opts.callerUserId);

  const name = opts.callerDisplayName ?? opts.callerUsername;
  for (const f of followers ?? []) {
    const row = f as { follower_id: string };
    await createNotification({
      userId: row.follower_id,
      type: "followed_member_call",
      title: `${name} published a new call`,
      body: `${opts.symbol} · ${opts.direction} thesis`,
      href: `/ticker/${opts.symbol}`,
      refCallId: opts.callId,
      actorUserId: opts.callerUserId,
    });
  }
}
