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
