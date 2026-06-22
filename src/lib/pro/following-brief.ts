import type { CallWithUser } from "@/lib/db/supabase";
import { filterCallsByFollowing } from "@/lib/calls/filter-feed";

export type ProFollowingHighlight = {
  kind: "publish" | "mover";
  symbol: string;
  username: string;
  displayName: string | null;
  direction: "long" | "short";
  returnPct: number | null;
  calledAt: string;
  callId: string;
};

const PUBLISH_WINDOW_MS = 48 * 3600000;

/** Highlights from people the viewer follows — recent publishes and top open movers. */
export function buildFollowingHighlights(
  latestCalls: CallWithUser[],
  followingIds: Set<string>
): ProFollowingHighlight[] {
  if (followingIds.size === 0) return [];

  const following = filterCallsByFollowing(latestCalls, followingIds);
  if (following.length === 0) return [];

  const now = Date.now();
  const recentPublishes = following
    .filter((c) => now - new Date(c.called_at).getTime() <= PUBLISH_WINDOW_MS)
    .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())
    .slice(0, 3)
    .map((c) => toHighlight(c, "publish"));

  const recentIds = new Set(recentPublishes.map((r) => r.callId));
  const topMovers = following
    .filter((c) => !recentIds.has(c.id) && c.return_pct != null)
    .sort((a, b) => (b.return_pct ?? -999) - (a.return_pct ?? -999))
    .slice(0, 2)
    .map((c) => toHighlight(c, "mover"));

  return [...recentPublishes, ...topMovers];
}

function toHighlight(
  c: CallWithUser,
  kind: ProFollowingHighlight["kind"]
): ProFollowingHighlight {
  return {
    kind,
    symbol: c.symbol.toUpperCase(),
    username: c.users.username ?? c.users.pin ?? "member",
    displayName: c.users.display_name,
    direction: c.direction === "short" ? "short" : "long",
    returnPct: c.return_pct != null ? Number(c.return_pct) : null,
    calledAt: c.called_at,
    callId: c.id,
  };
}
