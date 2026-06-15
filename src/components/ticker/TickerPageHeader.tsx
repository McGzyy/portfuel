import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { HypeMeter } from "@/components/brand/HypeMeter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketDataNote } from "@/components/market/MarketDataNote";
import { SymbolAvatar } from "@/components/market/SymbolAvatar";
import { journalSymbolPath } from "@/lib/journal/paths";
import { cn, formatPct, formatPrice } from "@/lib/utils";
import { TickerWatchlistChip } from "@/components/ticker/TickerWatchlistChip";
import type { loadTickerIntel } from "@/lib/market/ticker-intel";

export function TickerPageHeader({
  symbol,
  intel,
  session,
  onWatchlist,
  callCount = 0,
  isPro = false,
}: {
  symbol: string;
  intel: Awaited<ReturnType<typeof loadTickerIntel>> | null;
  session: boolean;
  onWatchlist?: boolean;
  callCount?: number;
  isPro?: boolean;
}) {
  const change = intel?.quote?.changePct;
  const changeAccent =
    change == null ? undefined : change >= 0 ? ("positive" as const) : ("negative" as const);

  return (
    <header className="pf-ticker-header">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          {session ? (
            <div className="flex flex-wrap items-center gap-3">
              {onWatchlist ? (
                <Link
                  href={journalSymbolPath(symbol)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-900 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                  Open journal
                </Link>
              ) : null}
            </div>
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
            <SymbolAvatar
              symbol={symbol}
              assetClass={intel?.assetClass}
              size="lg"
            />
            <h1 className="font-mono text-3xl font-bold tracking-tight text-[var(--pf-black)] sm:text-4xl">
              {symbol}
            </h1>
            <Badge variant={intel?.assetClass === "crypto" ? "fueled" : "default"}>
              {intel?.assetClass === "crypto" ? "Crypto" : "Equity"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--pf-gray-500)]">
            {intel?.companyName ?? symbol}
            {callCount > 0 ? (
              <span className="text-[var(--pf-gray-400)]">
                {" "}
                · {callCount} community call{callCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </p>
          {onWatchlist ? <TickerWatchlistChip symbol={symbol} /> : null}
          {intel?.quote ? (
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <p className="text-3xl font-bold tabular-nums tracking-tight text-[var(--pf-black)]">
                ${formatPrice(intel.quote.price)}
              </p>
              {change != null ? (
                <span
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    changeAccent === "positive" ? "pf-return-up" : "pf-return-down"
                  )}
                >
                  {formatPct(change)}
                </span>
              ) : null}
              <MarketDataNote className="mt-2 w-full" isPro={isPro} updatedAt={intel.quote.updatedAt} />
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
