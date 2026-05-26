import type { CallWithUser } from "@/lib/db/supabase";

export type FeedFilter = "all" | "fueled" | "equity" | "crypto" | "following";

export function filterCallsByFollowing(
  calls: CallWithUser[],
  followingIds: Set<string>
): CallWithUser[] {
  if (followingIds.size === 0) return [];
  return calls.filter((c) => followingIds.has(c.user_id));
}

export function filterCallsFeed(
  calls: CallWithUser[],
  filter: FeedFilter
): CallWithUser[] {
  switch (filter) {
    case "fueled":
      return calls.filter((c) => c.is_fueled);
    case "equity":
      return calls.filter((c) => (c.asset_class ?? "equity") === "equity");
    case "crypto":
      return calls.filter((c) => c.asset_class === "crypto");
    default:
      return calls;
  }
}

export function sortCallsByTargetProgress(calls: CallWithUser[]): CallWithUser[] {
  return [...calls].sort((a, b) => {
    const ap = a.target_progress != null ? Number(a.target_progress) : -1;
    const bp = b.target_progress != null ? Number(b.target_progress) : -1;
    return bp - ap;
  });
}

export function filterCallsBySearch(calls: CallWithUser[], query: string): CallWithUser[] {
  const q = query.trim().toLowerCase();
  if (!q) return calls;
  return calls.filter((c) => {
    const name = (c.users.display_name ?? "").toLowerCase();
    const user = (c.users.username ?? c.users.pin ?? "").toLowerCase();
    return (
      c.symbol.toLowerCase().includes(q) ||
      c.thesis.toLowerCase().includes(q) ||
      name.includes(q) ||
      user.includes(q)
    );
  });
}
