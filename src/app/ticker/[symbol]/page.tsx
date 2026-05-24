import Link from "next/link";
import { Plus } from "lucide-react";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { HypeMeter } from "@/components/brand/HypeMeter";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/marketing/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TickerChartClient } from "@/components/charts/TickerChartClient";
import { TickerIntelPanel } from "@/components/ticker/TickerIntelPanel";
import { CallThesisBlock } from "@/components/calls/CallThesisBlock";
import { TickerChartLegend } from "@/components/ticker/TickerChartLegend";
import { COPY } from "@/lib/copy";
import { formatPct, formatPrice } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import { toHeaderUser } from "@/lib/auth/session-user";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { loadTickerIntel } from "@/lib/market/ticker-intel";

export default async function TickerPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();
  const session = await getSession();

  let intel = null;
  if (hasSupabaseConfig()) {
    try {
      intel = await loadTickerIntel(symbol);
    } catch (e) {
      console.error("[ticker page]", e);
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

  const body = (
    <>
      <div className="pf-card-elevated overflow-hidden p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <TickerHeaderLeft intel={intel} symbol={symbol} session={session} />
          <TickerHeaderRight intel={intel} session={session} />
        </div>

        <div className="mt-8 overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)]">
          {intel?.candles?.length ? (
            <>
              <TickerChartClient candles={intel.candles} markers={intel.markers ?? []} />
              <TickerChartLegend callCount={intel.markers?.length ?? 0} />
            </>
          ) : (
            <div className="flex h-[380px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--pf-gray-500)]">
              <p className="font-medium text-[var(--pf-gray-600)]">Chart unavailable</p>
              <p className="text-xs">Check your Finnhub API key or try another symbol.</p>
            </div>
          )}
        </div>
      </div>

      <TickerIntelPanel intel={intel ?? emptyIntel} />

      <section className="mt-10">
        <SectionHeader
          eyebrow="Community"
          title={`Theses on ${symbol}`}
          subtitle="Member calls on this ticker, newest first."
        />
        <div className="mt-8 space-y-4">
          {(intel?.calls ?? []).length === 0 ? (
            <div className="pf-empty">
              <p className="font-medium text-[var(--pf-gray-700)]">No calls on this ticker yet</p>
              {session ? (
                <Link
                  href={`/calls/new?asset=${intel?.assetClass ?? "equity"}`}
                  className="mt-4 inline-block"
                >
                  <Button>
                    <Plus className="h-4 w-4" />
                    Be the first to call {symbol}
                  </Button>
                </Link>
              ) : (
                <Link href="/join" className="mt-4 inline-block">
                  <Button variant="outline">{COPY.ctaGetAccess}</Button>
                </Link>
              )}
            </div>
          ) : (
            (intel?.calls ?? []).map((c) => (
              <CallThesisBlock key={c.id} call={c} interactive={Boolean(session)} />
            ))
          )}
        </div>
      </section>
    </>
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

function TickerHeaderLeft({
  intel,
  symbol,
  session,
}: {
  intel: Awaited<ReturnType<typeof loadTickerIntel>> | null;
  symbol: string;
  session: Awaited<ReturnType<typeof getSession>>;
}) {
  return (
    <div>
      {session ? (
        <Link
          href="/dashboard"
          className="text-sm font-medium text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]"
        >
          ← Dashboard
        </Link>
      ) : (
        <Link href="/" className="text-sm font-medium text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]">
          ← Home
        </Link>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--pf-black)]">{symbol}</h1>
        <Badge variant={intel?.assetClass === "crypto" ? "fueled" : "default"}>
          {intel?.assetClass === "crypto" ? "Crypto" : "Equity"}
        </Badge>
      </div>
      <p className="text-[var(--pf-gray-500)]">{intel?.companyName ?? symbol}</p>
      {intel?.quote ? (
        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">
          ${formatPrice(intel.quote.price)}
          {intel.quote.changePct != null ? (
            <span
              className={`ml-2 text-base font-semibold ${
                intel.quote.changePct >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatPct(intel.quote.changePct)}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function TickerHeaderRight({
  intel,
  session,
}: {
  intel: Awaited<ReturnType<typeof loadTickerIntel>> | null;
  session: Awaited<ReturnType<typeof getSession>>;
}) {
  return (
    <div className="flex flex-col items-end gap-3">
      <HypeMeter score={intel?.hypeScore ?? 0} />
      {session ? (
        <Link href={`/calls/new?asset=${intel?.assetClass ?? "equity"}`}>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Call this ticker
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
