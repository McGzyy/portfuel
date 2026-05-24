import Link from "next/link";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { HypeMeter } from "@/components/brand/HypeMeter";
import { Badge } from "@/components/ui/badge";
import { TickerChartClient } from "@/components/charts/TickerChartClient";
import { TickerIntelPanel } from "@/components/ticker/TickerIntelPanel";
import { CallThesisBlock } from "@/components/calls/CallThesisBlock";
import { formatPct, formatPrice } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
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

  return (
    <>
      <SiteHeader userPin={session?.pin} showAuth={!session} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <TickerHeaderLeft intel={intel} symbol={symbol} />
          <TickerHeaderRight intel={intel} session={session} />
        </div>

        <div className="mt-8">
          {intel?.candles?.length ? (
            <TickerChartClient candles={intel.candles} markers={intel.markers ?? []} />
          ) : (
            <div className="flex h-[380px] items-center justify-center rounded-xl border border-dashed border-[var(--pf-border)] text-[var(--pf-gray-500)]">
              Chart unavailable — check Finnhub API key and symbol.
            </div>
          )}
        </div>

        <TickerIntelPanel intel={intel ?? emptyIntel} />

        <section className="mt-10">
          <h2 className="text-xl font-bold">Theses on {symbol}</h2>
          <p className="text-sm text-[var(--pf-gray-500)]">
            All squad calls on this ticker, newest first. FUELED calls highlighted.
          </p>
          <div className="mt-6 space-y-4">
            {(intel?.calls ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--pf-border)] py-12 text-center text-[var(--pf-gray-500)]">
                No calls on this ticker yet.
              </p>
            ) : (
              (intel?.calls ?? []).map((c) => (
                <CallThesisBlock key={c.id} call={c} interactive={Boolean(session)} />
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function TickerHeaderLeft({
  intel,
  symbol,
}: {
  intel: Awaited<ReturnType<typeof loadTickerIntel>> | null;
  symbol: string;
}) {
  return (
    <div>
      <Link href="/dashboard" className="text-sm text-[var(--pf-gray-500)] hover:text-[var(--pf-red)]">
        ← Dashboard
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{symbol}</h1>
        <Badge variant={intel?.assetClass === "crypto" ? "fueled" : "default"}>
          {intel?.assetClass === "crypto" ? "CRYPTO" : "EQUITY"}
        </Badge>
      </div>
      <p className="text-[var(--pf-gray-500)]">{intel?.companyName ?? symbol}</p>
      {intel?.quote ? (
        <p className="mt-2 text-lg font-semibold tabular-nums">
          ${formatPrice(intel.quote.price)}
          {intel.quote.changePct != null ? (
            <span
              className={`ml-2 text-sm ${
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
        <Link
          href={`/calls/new?asset=${intel?.assetClass ?? "equity"}`}
          className="text-sm font-medium text-[var(--pf-red)] hover:underline"
        >
          + Call this ticker
        </Link>
      ) : null}
    </div>
  );
}