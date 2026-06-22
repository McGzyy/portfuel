import Link from "next/link";
import { Bookmark, Notebook } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";
import type { JournalNextUp } from "@/lib/journal/next-up";
import type { WatchlistEntry } from "@/lib/watchlist/types";

function recentSymbols(items: WatchlistEntry[]) {
  return [...items]
    .filter((i) => i.journal_updated_at)
    .sort(
      (a, b) =>
        new Date(b.journal_updated_at!).getTime() - new Date(a.journal_updated_at!).getTime()
    )
    .slice(0, 5);
}

export function JournalContextRail({
  ideaCount,
  withThesis,
  activeCount,
  readyCount,
  nextUp,
  items,
}: {
  ideaCount: number;
  withThesis: number;
  activeCount: number;
  readyCount: number;
  nextUp?: JournalNextUp | null;
  items: WatchlistEntry[];
}) {
  const recent = recentSymbols(items);

  return (
    <ContextRailModule eyebrow="Private" title="Journal pulse" ariaLabel="Journal context">
      <ContextRailBlock title="Pipeline">
        <div className="grid grid-cols-3 gap-2">
          <OverviewRailMiniStat label="Ideas" value={String(ideaCount)} />
          <OverviewRailMiniStat label="Thesis" value={String(withThesis)} />
          <OverviewRailMiniStat
            label="Ready"
            value={String(readyCount)}
            accent={readyCount > 0 ? "positive" : undefined}
          />
        </div>
        {activeCount > 0 ? (
          <p className="mt-2 text-[11px] text-[var(--pf-gray-500)]">
            {activeCount} active research thread{activeCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </ContextRailBlock>

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
        </ContextRailBlock>
      ) : null}

      {recent.length > 0 ? (
        <ContextRailBlock title="Recent">
          <ul className="space-y-1">
            {recent.map((item) => (
              <li key={item.symbol}>
                <Link
                  href={`/dashboard/journal/${item.symbol}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-[var(--pf-gray-50)]"
                >
                  <span className="font-mono font-bold text-[var(--pf-black)]">{item.symbol}</span>
                  <span className="text-[var(--pf-gray-500)]">
                    {item.journal_progress?.ready_to_publish ? "Ready" : "Draft"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ContextRailBlock>
      ) : null}

      <ContextRailBlock title="Go">
        <div className="grid grid-cols-2 gap-1.5">
          <Link
            href="/dashboard/watchlist"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Bookmark className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Watchlist
          </Link>
          <Link
            href="/dashboard/journal?filter=ready#journal-ideas"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Notebook className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Ready list
          </Link>
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
