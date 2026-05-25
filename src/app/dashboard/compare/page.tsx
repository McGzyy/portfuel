import type { Metadata } from "next";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { TickerCompareWorkspace } from "@/components/pro/TickerCompareWorkspace";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchWatchlist } from "@/lib/watchlist/service";

export const metadata: Metadata = {
  title: "Ticker compare",
};

export default async function DashboardComparePage() {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  let watchlistSymbols: string[] = [];
  try {
    const wl = await fetchWatchlist(session.userId);
    watchlistSymbols = wl.map((w) => w.symbol);
  } catch {
    /* optional */
  }

  return (
    <>
      <WorkspacePageHeader
        eyebrow="Pro Intelligence"
        title="Ticker compare"
        description="See how symbols move together on a normalized % scale — useful when weighing which name the community is backing."
      />

      <div className="mt-8">
        <TickerCompareWorkspace
          locked={proLocked}
          proGateCta={proGateCta}
          watchlistSymbols={watchlistSymbols}
          initialSymbols={watchlistSymbols.slice(0, 2)}
        />
      </div>
    </>
  );
}
