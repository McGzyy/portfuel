import type { Metadata } from "next";
import { RankingsPageContent } from "@/components/rankings/RankingsPageContent";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { summarizeRankings } from "@/lib/calls/rankings-summary";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchFollowingIds } from "@/lib/follows/service";
import { fetchSuggestedFollows } from "@/lib/follows/suggested";
import { fetchWatchlist } from "@/lib/watchlist/service";

export const metadata: Metadata = {
  title: "Rankings",
};

export default async function DashboardRankingsPage() {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  let rows: Awaited<ReturnType<typeof fetchLeaderboard>> = [];
  if (isDemoMode() || hasSupabaseConfig()) {
    try {
      rows = await fetchLeaderboard(30);
    } catch (e) {
      console.error("[dashboard/rankings]", e);
    }
  }

  const summary = summarizeRankings(rows);

  let followingIds: string[] = [];
  let suggestedFollows: Awaited<ReturnType<typeof fetchSuggestedFollows>> = [];
  try {
    const [ids, watchlist] = await Promise.all([
      fetchFollowingIds(session.userId),
      fetchWatchlist(session.userId),
    ]);
    followingIds = ids;
    suggestedFollows = await fetchSuggestedFollows(
      session.userId,
      watchlist.map((w) => w.symbol)
    );
  } catch (e) {
    console.error("[dashboard/rankings follows]", e);
  }

  return (
    <RankingsPageContent
      rows={rows}
      summary={summary}
      proLocked={proLocked}
      proGateCta={proGateCta}
      loggedIn
      viewerUserId={session.userId}
      followingIds={followingIds}
      suggestedFollows={suggestedFollows}
    />
  );
}
