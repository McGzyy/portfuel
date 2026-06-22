import Link from "next/link";
import { BookOpen } from "lucide-react";
import { TickerBackNav } from "@/components/ticker/TickerBackNav";
import { HypeMeter } from "@/components/brand/HypeMeter";
import { Badge } from "@/components/ui/badge";
import { MarketQuoteContextLine } from "@/components/market/MarketQuoteContextLine";
import { MarketSessionBadge } from "@/components/market/MarketSessionBadge";
import { SymbolAvatar } from "@/components/market/SymbolAvatar";
import { journalSymbolPath } from "@/lib/journal/paths";
import { cn, formatPct, formatPrice } from "@/lib/utils";
import { TickerWatchlistChip } from "@/components/ticker/TickerWatchlistChip";
import { AddToWatchlistButton } from "@/components/watchlist/AddToWatchlistButton";
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
    <header className="pf-ticker-header space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <TickerBackNav loggedIn={session} />
        <HypeMeter score={intel?.hypeScore ?? 0} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-red)]">
          Ticker intelligence
        </p>
        <div className="mt-2 flex items-start gap-3">
          <SymbolAvatar symbol={symbol} assetClass={intel?.assetClass} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-4xl">
                {symbol}
              </h1>
              <Badge variant={intel?.assetClass === "crypto" ? "fueled" : "default"}>
                {intel?.assetClass === "crypto" ? "Crypto" : "Equity"}
              </Badge>
              {intel?.assetClass !== "crypto" ? (
                <MarketSessionBadge assetClass="equity" />
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-[var(--pf-gray-500)]">
              {intel?.companyName ?? symbol}
              {callCount > 0 ? (
                <span className="text-[var(--pf-gray-400)]">
                  {" "}
                  · {callCount} community call{callCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {session && onWatchlist ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <TickerWatchlistChip symbol={symbol} />
            <Link
              href={journalSymbolPath(symbol)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-900 hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              Open journal
            </Link>
          </div>
        ) : session ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <AddToWatchlistButton symbol={symbol} assetClass={intel?.assetClass} />
            <p className="text-xs leading-relaxed text-[var(--pf-gray-500)]">
              Track {symbol} privately — journal, alerts, and publish from one place.
            </p>
          </div>
        ) : null}
      </div>

      {intel?.quote ? (
        <div className="space-y-1.5 sm:space-y-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-[var(--pf-black)] sm:text-3xl">
              ${formatPrice(intel.quote.price)}
            </p>
            {change != null ? (
              <span
                className={cn(
                  "text-base font-bold tabular-nums sm:text-lg",
                  changeAccent === "positive" ? "pf-return-up" : "pf-return-down"
                )}
              >
                {formatPct(change)}
              </span>
            ) : null}
          </div>
          <MarketQuoteContextLine
            isPro={isPro}
            updatedAt={intel.quote.updatedAt}
            assetClass={intel?.assetClass}
          />
        </div>
      ) : null}
    </header>
  );
}
