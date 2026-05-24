import type { CallWithUser } from "@/lib/db/supabase";

export type FeedFilter = "all" | "fueled" | "equity" | "crypto";

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
