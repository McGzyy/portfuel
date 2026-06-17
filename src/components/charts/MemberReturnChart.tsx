"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ChartRangeToolbar } from "@/components/charts/ChartRangeToolbar";
import { ReturnLineChart } from "@/components/charts/ReturnLineChart";
import type { ChartRangeKey, ReturnChartPoint, ChartMemberAvatar } from "@/lib/charts/types";
import { filterLineByRange } from "@/lib/charts/range";
import { computeMaxDrawdown } from "@/lib/charts/cumulative-return";
import { formatPct } from "@/lib/utils";

export function MemberReturnChart({
  points,
  className,
  interactive = true,
  memberAvatar,
}: {
  points: ReturnChartPoint[];
  className?: string;
  interactive?: boolean;
  memberAvatar?: ChartMemberAvatar | null;
}) {
  const [range, setRange] = useState<ChartRangeKey>("all");
  const filtered = useMemo(
    () => filterLineByRange(points, range) as ReturnChartPoint[],
    [points, range]
  );
  const drawdown = useMemo(() => computeMaxDrawdown(points), [points]);

  if (points.length === 0) {
    return (
      <ChartFrame
        className={className}
        title="Cumulative return"
        subtitle="Running sum of marked-to-market returns on published calls"
      >
        <div className="flex h-[200px] items-center justify-center px-6 text-center text-sm text-[var(--pf-gray-500)]">
          Returns appear here once calls are marked to market.
        </div>
      </ChartFrame>
    );
  }

  const last = filtered[filtered.length - 1]?.value ?? points[points.length - 1]?.value;
  const lastAccent = last == null ? "" : last >= 0 ? "text-emerald-600" : "text-rose-600";
  const callMarkers = points.filter((p) => p.isCallMarker);
  const wins = callMarkers.filter((p) => p.outcome === "win").length;
  const losses = callMarkers.filter((p) => p.outcome === "loss").length;

  return (
    <ChartFrame
      className={className}
      title="Cumulative return"
      subtitle={
        interactive
          ? "Ticker logos mark each call · click to open symbol"
          : "Running sum of marked-to-market returns on published calls"
      }
      legend={
        wins + losses > 0 ? (
          <div className="flex flex-wrap items-center gap-4 px-4 py-2 text-xs text-[var(--pf-gray-500)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full ring-2 ring-emerald-500" aria-hidden />
              Win ({wins})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full ring-2 ring-rose-500" aria-hidden />
              Loss ({losses})
            </span>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChartRangeToolbar value={range} onChange={setRange} />
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--pf-gray-500)]">
            {last != null ? (
              <p>
                Total{" "}
                <span className={`font-bold tabular-nums ${lastAccent}`}>
                  {formatPct(last)}
                </span>
              </p>
            ) : null}
            {drawdown ? (
              <p className="text-xs" title="Peak-to-trough on cumulative return">
                Max drawdown{" "}
                <span className="font-semibold tabular-nums text-rose-600">
                  −{drawdown.pct.toFixed(1)}%
                </span>
              </p>
            ) : null}
          </div>
        </div>
        {filtered.length > 0 ? (
          <ReturnLineChart
            points={filtered}
            height={260}
            interactive={interactive}
            showMarkers
            showAvatars
            memberAvatar={memberAvatar}
          />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-[var(--pf-gray-500)]">
            No data in this range.
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
