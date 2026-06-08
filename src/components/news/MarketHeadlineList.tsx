import Link from "next/link";
import type { MarketHeadline } from "@/lib/market/market-headlines";
import { cn } from "@/lib/utils";

function formatHeadlineTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 3600000) {
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    return `${mins}m ago`;
  }
  if (diffMs < 86400000) {
    const hrs = Math.floor(diffMs / 3600000);
    return `${hrs}h ago`;
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function MarketHeadlineList({
  items,
  compact = false,
  showRelated = true,
}: {
  items: MarketHeadline[];
  compact?: boolean;
  showRelated?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--pf-gray-500)]">
        No headlines in this lane right now. Try another tab or check back later.
      </p>
    );
  }

  return (
    <ul className={cn(compact ? "space-y-2.5" : "divide-y divide-[var(--pf-border)]")}>
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            compact
              ? "pf-headline-card px-3 py-2.5"
              : "py-3 first:pt-0"
          )}
        >
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "font-medium text-[var(--pf-black)] hover:text-[var(--pf-red)]",
              compact ? "text-xs leading-snug" : "text-sm leading-snug"
            )}
          >
            {item.headline}
          </a>
          <div
            className={cn(
              "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[var(--pf-gray-400)]",
              !compact && "text-xs"
            )}
          >
            <span>
              {item.source} · {formatHeadlineTime(item.datetime)}
            </span>
            {item.onWatchlist ? (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800">
                Watchlist
              </span>
            ) : null}
          </div>
          {showRelated && item.relatedSymbols.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.relatedSymbols.slice(0, 6).map((sym) => (
                <Link
                  key={`${item.id}-${sym}`}
                  href={`/ticker/${sym}`}
                  className="rounded-full border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--pf-gray-700)] hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-surface)]"
                >
                  {sym}
                </Link>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
