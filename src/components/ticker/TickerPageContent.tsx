import { Suspense, cache } from "react";
import { ProQuoteRefreshMount } from "@/components/market/ProQuoteRefreshMount";
import { PublishSuccessBanner } from "@/components/calls/PublishSuccessBanner";
import { TickerChartSection } from "@/components/charts/TickerChartSection";
import { TickerCompanyStats } from "@/components/ticker/TickerCompanyStats";
import { buildIntelTeaserSummary } from "@/lib/market/intel-teaser";
import { TickerPageHeader } from "@/components/ticker/TickerPageHeader";
import { TickerCommunityBar } from "@/components/ticker/TickerCommunityBar";
import { TickerActionBar } from "@/components/ticker/TickerActionBar";
import { TickerPageNav } from "@/components/ticker/TickerPageNav";
import { TickerCallsSection } from "@/components/ticker/TickerCallsSection";
import { TickerIntelSection } from "@/components/ticker/TickerIntelSection";
import { TickerIntelSkeleton } from "@/components/ticker/TickerIntelSkeleton";
import { TickerPageSkeleton } from "@/components/ticker/TickerPageSkeleton";
import { ProIntelDiscoverStrip } from "@/components/pro/ProIntelDiscoverStrip";
import type { SessionPayload } from "@/lib/auth/session-types";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { summarizeTickerCommunity } from "@/lib/calls/ticker-community-stats";
import { isSymbolOnWatchlist } from "@/lib/watchlist/service";
import { loadTickerIntel } from "@/lib/market/ticker-intel";
import { buildTickerPriceLines } from "@/lib/charts/price-lines";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { fetchUserOpenCallOnSymbol } from "@/lib/calls/user-symbol-call";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { fetchDiscoveryOriginCallIds, callIsFromDiscovery } from "@/lib/desk-discovery/call-origin";

const loadTickerCallsWithDiscovery = cache(async function loadTickerCallsWithDiscovery(
  symbol: string
) {
  let intel = null;
  if (isDemoMode() || hasSupabaseConfig()) {
    try {
      intel = await loadTickerIntel(symbol);
    } catch (e) {
      console.error("[ticker page]", e);
    }
  }
  const rawCalls = intel?.calls ?? [];
  const discoveryCallIds = await fetchDiscoveryOriginCallIds(rawCalls.map((c) => c.id));
  const calls = rawCalls.map((c) => ({
    ...c,
    from_discovery: callIsFromDiscovery(c.id, discoveryCallIds),
  }));
  return { intel, calls };
});

function proFlags(session: SessionPayload | null) {
  const proContext = sessionToProContext(session);
  const proLocked = session ? isProIntelligenceLocked(proContext) : true;
  return {
    proLocked,
    proGateCta: getProGateCta(proContext),
    isPro: session ? !proLocked : false,
  };
}

async function TickerIntelBelowFold({
  symbol,
  session,
}: {
  symbol: string;
  session: SessionPayload | null;
}) {
  const { proLocked, proGateCta } = proFlags(session);
  let intel = null;
  if (isDemoMode() || hasSupabaseConfig()) {
    try {
      intel = await loadTickerIntel(symbol);
    } catch (e) {
      console.error("[ticker intel section]", e);
    }
  }

  const emptyIntel = {
    symbol,
    assetClass: "equity" as const,
    companyName: symbol,
    quote: null,
    hypeScore: 0,
    candles: [],
    markers: [],
    calls: [],
    news: [],
    earnings: [],
    filings: [],
    profile: null,
  };

  const intelData = intel ?? emptyIntel;
  const intelTeaser = buildIntelTeaserSummary(intelData);

  return (
    <TickerIntelSection
      intel={intelData}
      locked={proLocked}
      proGateCta={proGateCta}
      teaser={intelTeaser}
    />
  );
}

async function TickerPageCore({
  symbol,
  session,
}: {
  symbol: string;
  session: SessionPayload | null;
}) {
  const { proLocked, isPro } = proFlags(session);
  const { intel, calls } = await loadTickerCallsWithDiscovery(symbol);
  const communityStats = summarizeTickerCommunity(calls);

  const onWatchlist =
    session?.subscriptionStatus === "active"
      ? await isSymbolOnWatchlist(session.userId, symbol)
      : false;

  const emptyIntel = {
    symbol,
    assetClass: "equity" as const,
    companyName: symbol,
    quote: null,
    hypeScore: 0,
    candles: [],
    markers: [],
    calls: [],
    news: [],
    earnings: [],
    filings: [],
    profile: null,
  };

  const intelData = intel ?? emptyIntel;
  const isEquityIntel = intelData.assetClass === "equity";
  const chartPriceLines = buildTickerPriceLines({
    calls,
    viewerUserId: session?.userId,
  });

  let tickerWatchlistSymbols: string[] = [];
  let ownOpenCallOnSymbol = false;
  if (session?.subscriptionStatus === "active") {
    try {
      const openCall = await fetchUserOpenCallOnSymbol(session.userId, symbol);
      ownOpenCallOnSymbol = Boolean(openCall);
    } catch {
      /* optional */
    }
    if (proLocked) {
      try {
        const wl = await fetchWatchlist(session.userId);
        tickerWatchlistSymbols = wl.map((w) => w.symbol);
      } catch {
        /* optional */
      }
    }
  }

  return (
    <>
      {session ? (
        <Suspense fallback={null}>
          <PublishSuccessBanner symbol={symbol} username={session.username} />
        </Suspense>
      ) : null}
      {session && isPro ? <ProQuoteRefreshMount enabled symbols={[symbol]} /> : null}
      <section className="pf-ticker-shell space-y-4 sm:space-y-5">
        <TickerPageHeader
          symbol={symbol}
          intel={intel}
          session={Boolean(session)}
          onWatchlist={onWatchlist}
          callCount={calls.length}
          isPro={isPro}
        />

        {session ? (
          <div className="space-y-3 border-t border-[var(--pf-border)] pt-4">
            <TickerPageNav hasCalls={calls.length > 0} isEquity={isEquityIntel} />
            <TickerActionBar
              symbol={symbol}
              assetClass={intelData.assetClass}
              proLocked={proLocked}
              hasOwnOpenCall={ownOpenCallOnSymbol}
            />
          </div>
        ) : null}
      </section>

      {communityStats.callCount > 0 ? (
        <TickerCommunityBar stats={communityStats} />
      ) : null}

      {session && proLocked ? (
        <ProIntelDiscoverStrip
          symbol={symbol}
          assetClass={intelData.assetClass}
          watchlistSymbols={tickerWatchlistSymbols}
        />
      ) : null}

      <section id="chart" className="scroll-mt-24">
        <TickerChartSection
          symbol={symbol}
          initialCandles={intel?.candles ?? []}
          assetClass={intelData.assetClass}
          markers={intel?.markers ?? []}
          priceLines={chartPriceLines}
          proUnlocked={isPro}
          chartCalls={calls}
          interactive={Boolean(session)}
          viewerUserId={session?.userId}
          isPro={isPro}
          showUpgrade={session ? proLocked : false}
          canGenerateSummary={isPro}
          isAdmin={session?.role === "admin"}
        />
      </section>

      {isEquityIntel ? (
        <div className="pf-workspace-panel p-4 sm:p-6">
          <TickerCompanyStats intel={intelData} />
        </div>
      ) : null}

      <TickerCallsSection
        symbol={symbol}
        assetClass={intelData.assetClass}
        calls={calls}
        session={Boolean(session)}
        viewerUserId={session?.userId}
        isPro={isPro}
        proLocked={proLocked}
        isAdmin={session?.role === "admin"}
      />
    </>
  );
}

export function TickerPageContent({
  symbol,
  session,
}: {
  symbol: string;
  session: SessionPayload | null;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-5 sm:space-y-8">
      <Suspense fallback={<TickerPageSkeleton />}>
        <TickerPageCore symbol={symbol} session={session} />
      </Suspense>
      <Suspense fallback={<TickerIntelSkeleton />}>
        <TickerIntelBelowFold symbol={symbol} session={session} />
      </Suspense>
    </div>
  );
}
