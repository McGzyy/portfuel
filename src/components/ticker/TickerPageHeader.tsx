import Link from "next/link";
import { Plus } from "lucide-react";
import { HypeMeter } from "@/components/brand/HypeMeter";
import { WorkspaceBackLink } from "@/components/navigation/WorkspaceBackLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketDataNote } from "@/components/market/MarketDataNote";
import { formatPct, formatPrice } from "@/lib/utils";
import { TickerWatchlistChip } from "@/components/ticker/TickerWatchlistChip";
import type { loadTickerIntel } from "@/lib/market/ticker-intel";

export function TickerPageHeader({
  symbol,
  intel,
  session,
  backHref,
  backLabel,
  onWatchlist,
}: {
  symbol: string;
  intel: Awaited<ReturnType<typeof loadTickerIntel>> | null;
  session: boolean;
  backHref?: string;
  backLabel?: string;
  onWatchlist?: boolean;
}) {
  const change = intel?.quote?.changePct;
  const changeAccent =
    change == null ? undefined : change >= 0 ? ("positive" as const) : ("negative" as const);

  return (
    <header className="pf-ticker-header">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          {session ? (
            <WorkspaceBackLink href={backHref} label={backLabel} />
          ) : (
            <Link
              href="/"
              className="inline-flex text-sm font-medium text-[var(--pf-gray-500)] transition-colors hover:text-[var(--pf-red)]"
            >
              ← Home
            </Link>
          )}
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-red)]">
            Ticker intelligence
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--pf-black)] sm:text-4xl">
              {symbol}
            </h1>
            <Badge variant={intel?.assetClass === "crypto" ? "fueled" : "default"}>
              {intel?.assetClass === "crypto" ? "Crypto" : "Equity"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
            {intel?.companyName ?? symbol}
          </p>
          {onWatchlist ? <TickerWatchlistChip symbol={symbol} /> : null}
          {intel?.quote ? (
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <p className="text-3xl font-bold tabular-nums tracking-tight text-[var(--pf-black)]">
                ${formatPrice(intel.quote.price)}
              </p>
              {change != null ? (
                <span
                  className={
                    changeAccent === "positive"
                      ? "text-lg font-bold tabular-nums text-emerald-600"
                      : "text-lg font-bold tabular-nums text-rose-600"
                  }
                >
                  {formatPct(change)}
                </span>
              ) : null}
              <MarketDataNote className="mt-2 w-full" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-3">
          <HypeMeter score={intel?.hypeScore ?? 0} />
          {session ? (
            <Link
              href={`/calls/new?asset=${intel?.assetClass ?? "equity"}&symbol=${symbol}`}
            >
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Call this ticker
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
