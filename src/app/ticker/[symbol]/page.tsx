import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { TickerChartSection } from "@/components/charts/TickerChartSection";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { TickerCompanyStats } from "@/components/ticker/TickerCompanyStats";
import { TickerIntelPanel } from "@/components/ticker/TickerIntelPanel";
import { TickerIntelTeaser } from "@/components/ticker/TickerIntelTeaser";
import { buildIntelTeaserSummary } from "@/lib/market/intel-teaser";
import { CallThesisBlock } from "@/components/calls/CallThesisBlock";
import { TickerPageHeader } from "@/components/ticker/TickerPageHeader";
import { TickerCommunityBar } from "@/components/ticker/TickerCommunityBar";
import { ProIntelDiscoverStrip } from "@/components/pro/ProIntelDiscoverStrip";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { COPY } from "@/lib/copy";
import { formatProIntelligenceLabel } from "@/lib/marketing/plans";
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

  const communityStats = summarizeTickerCommunity(intel?.calls ?? []);
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
    calls: intel?.calls ?? [],
    viewerUserId: session?.userId,
  });

  const body = (
    <div className="space-y-6">
      <section className="pf-ticker-shell">
        <TickerPageHeader
          symbol={symbol}
          intel={intel}
          session={Boolean(session)}
          backHref="/dashboard/watchlist"
          backLabel="Watchlist"
          onWatchlist={onWatchlist}
        />

        <TickerChartSection
          className="mt-8"
          symbol={symbol}
          initialCandles={intel?.candles ?? []}
          markers={intel?.markers ?? []}
          priceLines={chartPriceLines}
          proUnlocked={isPro}
        />

        {intelGateLocked ? (
          <div className="mt-4">
            <ProIntelDiscoverStrip symbol={symbol} />
          </div>
        ) : null}
      </section>

      {isEquityIntel ? <TickerCompanyStats intel={intelData} /> : null}

      <TickerCommunityBar stats={communityStats} />

      <section className="border-t border-[var(--pf-border)] pt-10">
        <WorkspacePageHeader
          eyebrow="Community theses"
          title={`Calls on ${symbol}`}
          description="Member and desk theses on this symbol, newest first. Entry, target, and live return when available."
          className="mb-6 border-b-0 pb-0"
        />
        <div className="space-y-4">
          {(intel?.calls ?? []).length === 0 ? (
            <div className="pf-workspace-panel px-6 py-14 text-center">
              <p className="font-medium text-[var(--pf-gray-700)]">
                No calls on this ticker yet
              </p>
              {session ? (
                <Link
                  href={`/calls/new?asset=${intel?.assetClass ?? "equity"}&symbol=${symbol}`}
                  className="mt-6 inline-block"
                >
                  <Button>
                    <Plus className="h-4 w-4" />
                    Be the first to call {symbol}
                  </Button>
                </Link>
              ) : (
                <Link href="/join" className="mt-6 inline-block">
                  <Button variant="outline">{COPY.ctaGetAccess}</Button>
                </Link>
              )}
            </div>
          ) : (
            (intel?.calls ?? []).map((c) => (
              <div key={c.id} id={`thesis-${c.id}`} className="scroll-mt-24">
              <CallThesisBlock
                call={{
                  ...c,
                  user_id: c.user_id,
                  asset_class: c.asset_class,
                  symbol: c.symbol,
                  stop_price: c.stop_price,
                  last_price: c.last_price,
                  live: (c as { live?: boolean }).live,
                  users: {
                    display_name: c.users.display_name,
                    pin: c.users.username ?? c.users.pin,
                    username: c.users.username,
                    trusted_at: c.users.trusted_at,
                  },
                }}
                interactive={Boolean(session)}
                viewerUserId={session?.userId}
                isPro={isPro}
                showUpgrade={session ? proLocked : false}
                canGenerateSummary={isPro}
                isAdmin={session?.role === "admin"}
              />
              </div>
            ))
          )}
        </div>
      </section>

      {isEquityIntel ? (
        <section className="border-t border-[var(--pf-border)] pt-10">
          <ProIntelligenceGate
            locked={intelGateLocked}
            cta={proGateCta}
            variant="preview"
            title="Unlock full market intel"
            description={`Read headlines, earnings, and SEC filings on every equity ticker — included with ${formatProIntelligenceLabel()}.`}
            teaser={
              intelGateLocked ? <TickerIntelTeaser summary={intelTeaser} /> : undefined
            }
          >
            <TickerIntelPanel intel={intelData} />
          </ProIntelligenceGate>
        </section>
      ) : (
        <section className="border-t border-[var(--pf-border)] pt-10">
          <TickerIntelPanel intel={intelData} />
        </section>
      )}
    </div>
  );

  if (session) {
    return <AppShell user={toHeaderUser(session)}>{body}</AppShell>;
  }

  return (
    <>
      <SiteHeader user={session ? toHeaderUser(session) : undefined} />
      <div className="pf-app-bg">
        <main className="mx-auto max-w-6xl px-4 py-8">{body}</main>
      </div>
    </>
  );
}
