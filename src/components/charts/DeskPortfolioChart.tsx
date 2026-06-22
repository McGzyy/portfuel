"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ChartRangeToolbar } from "@/components/charts/ChartRangeToolbar";
import { ReturnLineChart } from "@/components/charts/ReturnLineChart";
import type { ChartRangeKey, ReturnChartPoint } from "@/lib/charts/types";
import { filterLineByRange } from "@/lib/charts/range";
import { computeMaxDrawdown } from "@/lib/charts/cumulative-return";
import { formatPct } from "@/lib/utils";

export function DeskPortfolioChart({
  points,
  openCount = 0,
  className,
}: {
  points: ReturnChartPoint[];
  openCount?: number;
  className?: string;
}) {
  const [range, setRange] = useState<ChartRangeKey>("all");
  const filtered = useMemo(
    () => filterLineByRange(points, range) as ReturnChartPoint[],
    [points, range]
  );
  const drawdown = useMemo(() => computeMaxDrawdown(points), [points]);
  const positionMarkers = useMemo(
    () => points.filter((p) => p.isCallMarker && p.symbol),
    [points]
  );

  if (points.length === 0) {
    return (
      <ChartFrame
        className={className}
        title="Model portfolio curve"
        subtitle="Equal-weight return across open desk positions"
      >
        <div className="flex h-[200px] flex-col items-center justify-center gap-1 px-6 text-center text-sm text-[var(--pf-gray-500)]">
          {openCount > 0 ? (
            <>
              <p>Live marks are syncing for {openCount} open position{openCount === 1 ? "" : "s"}.</p>
              <p className="text-xs text-[var(--pf-gray-400)]">Return history plots once entry prices are set.</p>
            </>
          ) : (
            <p>No open desk positions right now. New Fueled calls will appear in the model portfolio.</p>
          )}
        </div>
      </ChartFrame>
    );
  }

  const last = filtered[filtered.length - 1]?.value ?? points[points.length - 1]?.value;
  const lastAccent = last == null ? "" : last >= 0 ? "pf-return-up" : "pf-return-down";

  return (
    <ChartFrame
      className={className}
      title="Model portfolio curve"
      subtitle="Ticker logos mark when each position joined the basket · click to open symbol"
      legend={
        positionMarkers.length > 0 ? (
          <div className="flex flex-wrap items-center gap-4 px-4 py-2 text-xs text-[var(--pf-gray-500)]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-full ring-[2px] ring-[var(--pf-red)]"
                aria-hidden
              />
              Fueled position added ({positionMarkers.length})
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
                Basket{" "}
                <span className={`font-bold tabular-nums ${lastAccent}`}>
                  {formatPct(last)}
                </span>
              </p>
            ) : null}
            {drawdown ? (
              <p className="text-xs">
                Max drawdown{" "}
                <span className="font-semibold tabular-nums pf-return-down">
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
            interactive
            showAvatars
            pinEmblem="symbol"
            pinSymbolKind="fueled"
            filled
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
