import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import type { FollowedMember } from "@/lib/follows/types";

const MAX_FOLLOWS = 50;

export async function fetchFollowingIds(followerId: string): Promise<string[]> {
  if (isDemoMode()) return [];

  const db = createServiceClient();
  const { data, error } = await db
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", followerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[follows/list]", error);
    return [];
  }

  return (data ?? []).map((r) => (r as { following_id: string }).following_id);
}

export async function fetchFollowingMembers(followerId: string): Promise<FollowedMember[]> {
  const ids = await fetchFollowingIds(followerId);
  if (!ids.length) return [];

  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("id, username, display_name")
    .in("id", ids);

  if (error) {
    console.error("[follows/members]", error);
    return [];
  }

  const byId = new Map(
    (data ?? []).map((u) => {
      const row = u as { id: string; username: string; display_name: string | null };
      return [row.id, row] as const;
    })
  );

  return ids.flatMap((id) => {
    const u = byId.get(id);
    if (!u?.username) return [];
    return [
      {
        userId: u.id,
        username: u.username,
        displayName: u.display_name,
      },
    ];
  });
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (isDemoMode()) return false;
  if (followerId === followingId) return false;

  const db = createServiceClient();
  const { data } = await db
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  return Boolean(data);
}

export async function followMember(
  followerId: string,
  followingId: string
): Promise<{ ok: true } | { error: string }> {
  if (followerId === followingId) return { error: "cannot_follow_self" };
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();

  const { data: target } = await db
    .from("users")
    .select("id, subscription_status")
    .eq("id", followingId)
    .maybeSingle();

  const row = target as { id: string; subscription_status: string } | null;
  if (!row || row.subscription_status !== "active") {
    return { error: "member_not_found" };
  }

  const { count } = await db
    .from("user_follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("follower_id", followerId);

  if ((count ?? 0) >= MAX_FOLLOWS) return { error: "follow_limit" };

  const { error } = await db.from("user_follows").insert({
    follower_id: followerId,
    following_id: followingId,
  } as never);

  if (error) {
    if (error.code === "23505") return { ok: true };
    console.error("[follows/follow]", error);
    return { error: "db_error" };
  }

  return { ok: true };
}

export async function unfollowMember(
  followerId: string,
  followingId: string
): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const { error } = await db
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    console.error("[follows/unfollow]", error);
    return { error: "db_error" };
  }

  return { ok: true };
}
