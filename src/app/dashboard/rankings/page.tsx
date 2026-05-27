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

  return (
    <RankingsPageContent
      rows={rows}
      summary={summary}
      proLocked={proLocked}
      proGateCta={proGateCta}
      loggedIn
    />
  );
}
