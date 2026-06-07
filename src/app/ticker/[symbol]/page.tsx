import type { Metadata } from "next";
import { Suspense } from "react";
import { ProQuoteRefreshMount } from "@/components/market/ProQuoteRefreshMount";
import { PublishSuccessBanner } from "@/components/calls/PublishSuccessBanner";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { AppShell } from "@/components/layout/AppShell";
import { TickerChartSection } from "@/components/charts/TickerChartSection";
import { TickerCompanyStats } from "@/components/ticker/TickerCompanyStats";
import { buildIntelTeaserSummary } from "@/lib/market/intel-teaser";
import { TickerPageHeader } from "@/components/ticker/TickerPageHeader";
import { TickerCommunityBar } from "@/components/ticker/TickerCommunityBar";
import { TickerActionBar } from "@/components/ticker/TickerActionBar";
import { TickerPageNav } from "@/components/ticker/TickerPageNav";
import { TickerCallsSection } from "@/components/ticker/TickerCallsSection";
import { TickerThesisHashFocus } from "@/components/ticker/TickerThesisHashFocus";
import { TickerIntelSection } from "@/components/ticker/TickerIntelSection";
import { ProIntelDiscoverStrip } from "@/components/pro/ProIntelDiscoverStrip";
import { SITE_NAME } from "@/lib/seo/site";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
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

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  return {
    title: `${symbol} · Ticker intel`,
    description: `Live price, community theses, and market intelligence for ${symbol} on ${SITE_NAME}.`,
  };
}

export default async function TickerPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const session = await getSession();

  let intel = null;
  if (isDemoMode() || hasSupabaseConfig()) {
    try {
      intel = await loadTickerIntel(symbol);
    } catch (e) {
      console.error("[ticker page]", e);
    }
  }

  const calls = intel?.calls ?? [];
  const communityStats = summarizeTickerCommunity(calls);
  const proContext = sessionToProContext(session);
  const proLocked = session ? isProIntelligenceLocked(proContext) : true;
  const proGateCta = getProGateCta(proContext);
  const isPro = session ? !proLocked : false;
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
  const intelGateLocked = proLocked && isEquityIntel;
  const intelTeaser = buildIntelTeaserSummary(intelData);
  const chartPriceLines = buildTickerPriceLines({
    calls,
    viewerUserId: session?.userId,
  });

  const body = (
    <div className="mx-auto max-w-5xl space-y-8">
      {session ? (
        <Suspense fallback={null}>
          <PublishSuccessBanner symbol={symbol} username={session.username} />
        </Suspense>
      ) : null}
      {session && isPro ? <ProQuoteRefreshMount enabled symbols={[symbol]} /> : null}
      <section className="pf-ticker-shell">
        <TickerPageHeader
          symbol={symbol}
          intel={intel}
          session={Boolean(session)}
          onWatchlist={onWatchlist}
          callCount={calls.length}
          isPro={isPro}
        />

        {session ? (
          <>
            <TickerPageNav hasCalls={calls.length > 0} isEquity={isEquityIntel} />
            <TickerActionBar
              symbol={symbol}
              assetClass={intelData.assetClass}
              proLocked={proLocked}
            />
          </>
        ) : null}
      </section>

      {communityStats.callCount > 0 ? (
        <TickerCommunityBar stats={communityStats} />
      ) : null}

      {session && proLocked ? <ProIntelDiscoverStrip symbol={symbol} /> : null}

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

      <TickerThesisHashFocus />
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

      <TickerIntelSection
        intel={intelData}
        locked={intelGateLocked}
        proGateCta={proGateCta}
        teaser={intelTeaser}
      />
    </div>
  );

  if (session) {
    return <AppShell user={toHeaderUser(session)}>{body}</AppShell>;
  }

  return (
    <>
      <SiteHeader user={session ? toHeaderUser(session) : undefined} />
      <div className="pf-app-bg">
        <main className="mx-auto max-w-5xl px-4 py-8">{body}</main>
      </div>
    </>
  );
}
