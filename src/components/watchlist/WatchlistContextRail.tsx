import Link from "next/link";
import { Notebook, Share2 } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";
import type { JournalNextUp } from "@/lib/journal/next-up";
import type { BookPostureSummary } from "@/lib/watchlist/book-posture";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { formatPct, formatPrice } from "@/lib/utils";

const MAX_WATCHLIST = 24;

function topMovers(items: WatchlistEntry[]) {
  return [...items]
    .filter((i) => i.change_since_add_pct != null || i.return_pct != null)
    .sort((a, b) => {
      const aPct = a.change_since_add_pct ?? a.return_pct ?? 0;
      const bPct = b.change_since_add_pct ?? b.return_pct ?? 0;
      return Math.abs(Number(bPct)) - Math.abs(Number(aPct));
    })
    .slice(0, 5);
}

export function WatchlistContextRail({
  items,
  symbolCount,
  unreadAlerts,
  callsLast7d,
  nextUp,
  bookPosture,
}: {
  items: WatchlistEntry[];
  symbolCount: number;
  unreadAlerts: number;
  callsLast7d: number;
  nextUp?: JournalNextUp | null;
  bookPosture?: BookPostureSummary | null;
}) {
  const movers = topMovers(items);
  const readyCount = items.filter((i) => i.journal_progress?.ready_to_publish).length;

  return (
    <ContextRailModule eyebrow="Research" title="Watchlist pulse" ariaLabel="Watchlist context">
      <ContextRailBlock title="Your list">
        <div className="grid grid-cols-3 gap-2">
          <OverviewRailMiniStat label="Symbols" value={`${symbolCount}/${MAX_WATCHLIST}`} />
          <OverviewRailMiniStat
            label="Alerts"
            value={String(unreadAlerts)}
            accent={unreadAlerts > 0 ? "negative" : undefined}
          />
          <OverviewRailMiniStat label="Calls 7d" value={String(callsLast7d)} />
        </div>
      </ContextRailBlock>

      {bookPosture && bookPosture.inBook > 0 ? (
        <ContextRailBlock title="In your book">
          <div className="grid grid-cols-3 gap-2">
            <OverviewRailMiniStat label="Active" value={String(bookPosture.active)} />
            <OverviewRailMiniStat label="Building" value={String(bookPosture.building)} />
            <OverviewRailMiniStat label="Trimming" value={String(bookPosture.trimming)} />
          </div>
        </ContextRailBlock>
      ) : null}

      {nextUp ? (
        <ContextRailBlock title="Next up">
          <Link
            href={nextUp.href}
            className="block rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 hover:bg-white"
          >
            <p className="font-mono text-sm font-bold text-[var(--pf-black)]">{nextUp.symbol}</p>
            <p className="mt-1 text-[11px] leading-snug text-[var(--pf-gray-600)]">{nextUp.detail}</p>
            <p className="mt-2 text-[11px] font-semibold text-[var(--pf-red)]">{nextUp.cta} →</p>
          </Link>
          {readyCount > 0 ? (
            <p className="mt-2 text-[11px] text-[var(--pf-gray-500)]">
              {readyCount} symbol{readyCount === 1 ? "" : "s"} ready to publish
            </p>
          ) : null}
        </ContextRailBlock>
      ) : null}

      {movers.length > 0 ? (
        <ContextRailBlock title="Movers">
          <ul className="space-y-1">
            {movers.map((item) => {
              const pct = item.change_since_add_pct ?? item.return_pct;
              return (
                <li key={item.symbol}>
                  <Link
                    href={`/dashboard/watchlist/${item.symbol}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-[var(--pf-gray-50)]"
                  >
                    <span className="font-mono font-bold text-[var(--pf-black)]">{item.symbol}</span>
                    <span className="tabular-nums text-[var(--pf-gray-500)]">
                      {pct != null
                        ? formatPct(Number(pct))
                        : item.last_price != null
                          ? formatPrice(Number(item.last_price))
                          : "—"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </ContextRailBlock>
      ) : null}

      <ContextRailBlock title="Go">
        <div className="grid grid-cols-2 gap-1.5">
          <Link
            href="/dashboard/journal"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Notebook className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Journal
          </Link>
          <Link
            href="/dashboard/feed"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Share2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Feed
          </Link>
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
