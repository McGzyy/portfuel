import type { Metadata } from "next";
import { CompareCommandHeader } from "@/components/pro/CompareCommandHeader";
import { TickerCompareWorkspace } from "@/components/pro/TickerCompareWorkspace";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { parseCompareSymbolsParam } from "@/lib/dashboard/compare-symbols";
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

export default async function DashboardComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>;
}) {
  const params = await searchParams;
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

  const fromQuery = parseCompareSymbolsParam(params.symbols);
  const initialSymbols =
    fromQuery.length >= 2
      ? fromQuery
      : fromQuery.length === 1
        ? [...fromQuery, ...watchlistSymbols.filter((s) => s !== fromQuery[0])].slice(0, 3)
        : watchlistSymbols.slice(0, 2);

  return (
    <div className="space-y-6">
      <CompareCommandHeader
        symbolCount={initialSymbols.length}
        watchlistCount={watchlistSymbols.length}
      />

      <WorkspaceQuickActions proUnlocked={!proLocked} />

      {proLocked ? <ProMembershipStrip locked /> : null}

      <TickerCompareWorkspace
        locked={proLocked}
        proGateCta={proGateCta}
        watchlistSymbols={watchlistSymbols}
        initialSymbols={initialSymbols}
        syncUrl
      />
    </div>
  );
}
