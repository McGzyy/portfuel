import Link from "next/link";
import { Star } from "lucide-react";

export function TickerWatchlistChip({ symbol }: { symbol: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Link
        href="/dashboard/watchlist"
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
      >
        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
        On your watchlist
      </Link>
      <span className="text-xs text-[var(--pf-gray-500)]">
        Chart, calls, and desk context for {symbol} are on this page.
      </span>
    </div>
  );
}
