import Link from "next/link";
import { Flame, Rows3 } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";
import type { FeedSummary } from "@/lib/calls/feed-summary";
import { formatPct } from "@/lib/utils";

export function FeedContextRail({
  summary,
  newCount,
  hotTickers,
  topSymbol,
  topReturnPct,
}: {
  summary: FeedSummary;
  newCount: number;
  hotTickers: Array<{ symbol: string; callCount: number; avgReturnPct: number | null }>;
  topSymbol?: string | null;
  topReturnPct?: number | null;
}) {
  return (
    <ContextRailModule eyebrow="Community" title="Feed pulse" ariaLabel="Feed context">
      <ContextRailBlock title="This view">
        <div className="grid grid-cols-3 gap-2">
          <OverviewRailMiniStat label="Calls" value={String(summary.count)} />
          <OverviewRailMiniStat
            label="New"
            value={String(newCount)}
            accent={newCount > 0 ? "positive" : undefined}
          />
          <OverviewRailMiniStat
            label="Avg ret"
            value={summary.avgReturnPct != null ? formatPct(summary.avgReturnPct) : "—"}
            accent={
              summary.avgReturnPct != null
                ? summary.avgReturnPct >= 0
                  ? "positive"
                  : "negative"
                : undefined
            }
          />
        </div>
      </ContextRailBlock>

      {topSymbol && topReturnPct != null ? (
        <ContextRailBlock title="Leader">
          <Link
            href={`/ticker/${topSymbol}`}
            className="flex items-center justify-between rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 hover:bg-white"
          >
            <span className="font-mono text-sm font-bold text-[var(--pf-black)]">{topSymbol}</span>
            <span
              className={`text-sm font-bold tabular-nums ${topReturnPct >= 0 ? "text-emerald-600" : "text-[var(--pf-red)]"}`}
            >
              {formatPct(topReturnPct)}
            </span>
          </Link>
        </ContextRailBlock>
      ) : null}

      {hotTickers.length > 0 ? (
        <ContextRailBlock title="Hot tickers">
          <ul className="space-y-1">
            {hotTickers.slice(0, 5).map((t) => (
              <li key={t.symbol}>
                <Link
                  href={`/ticker/${t.symbol}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-[var(--pf-gray-50)]"
                >
                  <span className="font-mono font-bold text-[var(--pf-black)]">{t.symbol}</span>
                  <span className="tabular-nums text-[var(--pf-gray-500)]">
                    {t.avgReturnPct != null ? formatPct(t.avgReturnPct) : `${t.callCount} calls`}
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
            href="/dashboard/feed?new=1"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Rows3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            New only
          </Link>
          <Link
            href="/dashboard/desk"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
          >
            <Flame className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Fueled desk
          </Link>
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
