import type { Metadata } from "next";
import { EarningsSurfacesExplainer } from "@/components/pro/EarningsSurfacesExplainer";
import { ProCommunityScreener } from "@/components/pro/ProCommunityScreener";
import { ProEarningsBattleboardSection } from "@/components/pro/ProEarningsBattleboardSection";
import { ResearchCommandHeader } from "@/components/pro/ResearchCommandHeader";
import { TickerCompareWorkspace } from "@/components/pro/TickerCompareWorkspace";
import { buildCompareHref, parseCompareSymbolsParam } from "@/lib/dashboard/compare-symbols";
import { parseResearchHubTab } from "@/lib/dashboard/research-hub";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchEarningsBattleboard } from "@/lib/earnings/battleboard";
import {
  fetchMarketHeadlinesByLane,
  parseMarketHeadlineLane,
} from "@/lib/market/market-headlines";
import { MarketHeadlinesPanel } from "@/components/news/MarketHeadlinesPanel";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { fetchCommunityScreener } from "@/lib/screener/community";
import { fetchWatchlist } from "@/lib/watchlist/service";

export const metadata: Metadata = {
  title: "Research hub",
};

function compareDetail(symbolCount: number, watchlistCount: number): string {
  if (symbolCount >= 2) {
    return `Comparing ${symbolCount} symbols on a normalized % scale with Fueled, community, and your call levels.`;
  }
  if (watchlistCount > 0) {
    return `Pick 2–3 symbols — your watchlist has ${watchlistCount} name${watchlistCount === 1 ? "" : "s"} ready.`;
  }
  return "Add at least two tickers to see how they move together.";
}

export default async function DashboardResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; symbols?: string; lane?: string }>;
}) {
  const sp = await searchParams;
  const tab = parseResearchHubTab(sp.tab);
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  if (tab === "screener") {
    const data = await fetchCommunityScreener();
    let watchlistSymbols: string[] = [];
    try {
      const wl = await fetchWatchlist(session.userId);
      watchlistSymbols = wl.map((w) => w.symbol);
    } catch {
      /* optional */
    }
    const compareSymbols = [data.mostCalled[0]?.symbol, data.topReturns[0]?.symbol].filter(
      (s): s is string => Boolean(s)
    );
    const compareHref = buildCompareHref(compareSymbols);

    return (
      <div className="space-y-6">
        <ResearchCommandHeader tab="screener" />
        {!proLocked && compareSymbols.length >= 2 ? (
          <p className="text-xs text-[var(--pf-gray-500)]">
            <a href={compareHref} className="font-semibold text-[var(--pf-red)] hover:underline">
              Compare {compareSymbols.join(" vs ")} →
            </a>
          </p>
        ) : null}
        <ProCommunityScreener
          data={data}
          locked={proLocked}
          proGateCta={proGateCta}
          showExport
          watchlistSymbols={watchlistSymbols}
        />
      </div>
    );
  }

  if (tab === "earnings") {
    const rows = await fetchEarningsBattleboard();
    let watchlistSymbols: string[] = [];
    try {
      const wl = await fetchWatchlist(session.userId);
      watchlistSymbols = wl.map((w) => w.symbol);
    } catch {
      /* optional */
    }

    return (
      <div className="space-y-6">
        <ResearchCommandHeader tab="earnings" />
        <EarningsSurfacesExplainer />
        <ProEarningsBattleboardSection
          rows={rows}
          locked={proLocked}
          proGateCta={proGateCta}
          watchlistSymbols={watchlistSymbols}
        />
      </div>
    );
  }

  if (tab === "news") {
    let watchlistSymbols: string[] = [];
    try {
      const wl = await fetchWatchlist(session.userId);
      watchlistSymbols = wl.map((w) => w.symbol);
    } catch {
      /* optional */
    }

    const initialLane = parseMarketHeadlineLane(sp.lane);
    const initialHeadlines = await fetchMarketHeadlinesByLane(initialLane, watchlistSymbols);

    return (
      <div className="space-y-6">
        <ResearchCommandHeader tab="news" />
        <MarketHeadlinesPanel
          initialLane={initialLane}
          initialHeadlines={initialHeadlines}
          watchlistCount={watchlistSymbols.length}
        />
      </div>
    );
  }

  let watchlistSymbols: string[] = [];
  try {
    const wl = await fetchWatchlist(session.userId);
    watchlistSymbols = wl.map((w) => w.symbol);
  } catch {
    /* optional */
  }

  const fromQuery = parseCompareSymbolsParam(sp.symbols);
  const initialSymbols =
    fromQuery.length >= 2
      ? fromQuery
      : fromQuery.length === 1
        ? [...fromQuery, ...watchlistSymbols.filter((s) => s !== fromQuery[0])].slice(0, 3)
        : watchlistSymbols.slice(0, 2);

  return (
    <div className="space-y-6">
      <ResearchCommandHeader
        tab="compare"
        detail={compareDetail(initialSymbols.length, watchlistSymbols.length)}
      />
      <TickerCompareWorkspace
        locked={proLocked}
        proGateCta={proGateCta}
        watchlistSymbols={watchlistSymbols}
        initialSymbols={initialSymbols}
        viewerUserId={session.userId}
        syncUrl
      />
    </div>
  );
}
