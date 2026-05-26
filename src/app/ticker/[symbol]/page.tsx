import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { TickerChartSection } from "@/components/charts/TickerChartSection";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { TickerIntelPanel } from "@/components/ticker/TickerIntelPanel";
import { CallThesisBlock } from "@/components/calls/CallThesisBlock";
import { TickerPageHeader } from "@/components/ticker/TickerPageHeader";
import { TickerCommunityBar } from "@/components/ticker/TickerCommunityBar";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { COPY } from "@/lib/copy";
import { SITE_NAME } from "@/lib/seo/site";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { summarizeTickerCommunity } from "@/lib/calls/ticker-community-stats";
import { isSymbolOnWatchlist } from "@/lib/watchlist/service";
import { loadTickerIntel } from "@/lib/market/ticker-intel";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

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
          candles={intel?.candles ?? []}
          markers={intel?.markers ?? []}
        />
      </section>

      <TickerCommunityBar stats={communityStats} />

      <ProIntelligenceGate
        locked={proLocked}
        cta={proGateCta}
        title="Pro market intel"
        description="News, earnings, SEC filings, and company stats — Pro Intelligence ($129/mo)."
      >
        <TickerIntelPanel intel={intel ?? emptyIntel} />
      </ProIntelligenceGate>

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
              <CallThesisBlock
                key={c.id}
                call={{
                  ...c,
                  user_id: c.user_id,
                  asset_class: c.asset_class,
                  symbol: c.symbol,
                  stop_price: c.stop_price,
                  last_price: c.last_price,
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
              />
            ))
          )}
        </div>
      </section>
    </div>
  );

  if (session) {
    return <AppShell user={toHeaderUser(session)}>{body}</AppShell>;
  }

  return (
    <>
      <SiteHeader />
      <div className="pf-app-bg">
        <main className="mx-auto max-w-6xl px-4 py-8">{body}</main>
      </div>
    </>
  );
}
