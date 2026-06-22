import Link from "next/link";
import { BarChart3, Flame, Radar, Rows3 } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import { OverviewRailMiniStat } from "@/components/dashboard/OverviewContextRail.client";
import type { FueledTrackRecord } from "@/lib/fueled/track-record";
import type { DeskPortfolioView } from "@/lib/desk/portfolio";
import { cn, formatPct } from "@/lib/utils";

export function DeskContextRail({
  openPositions,
  totalDeskCalls,
  trackRecord,
  pinnedSymbol,
  hasWeeklyNote,
  openEntries = [],
  discoveryActionableCount,
  isAdmin = false,
}: {
  openPositions: number;
  totalDeskCalls: number;
  trackRecord: FueledTrackRecord;
  pinnedSymbol?: string | null;
  hasWeeklyNote: boolean;
  openEntries?: DeskPortfolioView[];
  discoveryActionableCount?: number;
  isAdmin?: boolean;
}) {
  const openBook = openEntries.filter((e) => e.status === "open").slice(0, 5);

  return (
    <ContextRailModule eyebrow="House" title="Desk intel" ariaLabel="Fueled desk context">
      <ContextRailBlock title="Book">
        <div className="grid grid-cols-3 gap-2">
          <OverviewRailMiniStat label="Open" value={String(openPositions)} />
          <OverviewRailMiniStat label="Calls" value={String(totalDeskCalls)} />
          <OverviewRailMiniStat
            label="Win %"
            value={
              trackRecord.winRate != null ? `${Math.round(trackRecord.winRate)}%` : "—"
            }
            accent={
              trackRecord.winRate != null && trackRecord.winRate >= 50 ? "positive" : undefined
            }
          />
        </div>
      </ContextRailBlock>

      {openBook.length > 0 ? (
        <ContextRailBlock title="Open book">
          <ul className="space-y-1.5">
            {openBook.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/ticker/${entry.symbol}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 hover:bg-white"
                >
                  <span className="font-mono text-xs font-bold text-[var(--pf-black)]">
                    {entry.symbol}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      (entry.return_pct ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                  >
                    {entry.return_pct != null ? formatPct(entry.return_pct) : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ContextRailBlock>
      ) : null}

      {trackRecord.bestSymbol && trackRecord.bestReturnPct != null ? (
        <ContextRailBlock title="Best 30d">
          <Link
            href={`/ticker/${trackRecord.bestSymbol}`}
            className="flex items-center justify-between rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 hover:bg-white"
          >
            <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
              {trackRecord.bestSymbol}
            </span>
            <span className="text-sm font-bold tabular-nums text-emerald-600">
              {formatPct(trackRecord.bestReturnPct)}
            </span>
          </Link>
        </ContextRailBlock>
      ) : null}

      <ContextRailBlock title="Track record">
        <div className="grid grid-cols-2 gap-2">
          <OverviewRailMiniStat
            label="Avg ret"
            value={
              trackRecord.avgReturnPct != null ? formatPct(trackRecord.avgReturnPct) : "—"
            }
            accent={
              trackRecord.avgReturnPct != null
                ? trackRecord.avgReturnPct >= 0
                  ? "positive"
                  : "negative"
                : undefined
            }
          />
          <OverviewRailMiniStat label="Closed" value={String(trackRecord.closedCalls)} />
        </div>
        {pinnedSymbol ? (
          <p className="mt-2 text-[11px] text-[var(--pf-gray-500)]">
            Pinned:{" "}
            <Link
              href={`/ticker/${pinnedSymbol}`}
              className="font-mono font-semibold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
            >
              {pinnedSymbol}
            </Link>
          </p>
        ) : null}
        {hasWeeklyNote ? (
          <p className="mt-1 text-[11px] font-medium text-emerald-700">Weekly note published</p>
        ) : null}
      </ContextRailBlock>

      <ContextRailBlock title="Go">
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/dashboard/feed?filter=fueled"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
            >
              <Rows3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
              Fueled feed
            </Link>
            <Link
              href="/dashboard/research"
              className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
            >
              <BarChart3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
              Research
            </Link>
          </div>
          {isAdmin ? (
            <>
              <Link
                href="/admin?tab=desk"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
              >
                <Flame className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                Admin desk
              </Link>
              <Link
                href="/admin?tab=discovery"
                className="flex items-center justify-between gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-2 text-[11px] font-semibold text-[var(--pf-gray-700)] hover:bg-white"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Radar className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                  Discovery radar
                </span>
                {discoveryActionableCount != null && discoveryActionableCount > 0 ? (
                  <span className="rounded-full bg-[var(--pf-red-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--pf-red)]">
                    {discoveryActionableCount}
                  </span>
                ) : null}
              </Link>
            </>
          ) : null}
        </div>
      </ContextRailBlock>
    </ContextRailModule>
  );
}
