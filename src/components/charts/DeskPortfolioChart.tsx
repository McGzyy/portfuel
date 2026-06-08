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
  className,
}: {
  points: ReturnChartPoint[];
  className?: string;
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
        title="Model portfolio curve"
        subtitle="Equal-weight return across open desk positions"
      >
        <div className="flex h-[200px] items-center justify-center px-6 text-center text-sm text-[var(--pf-gray-500)]">
          Open desk positions will plot here as the model portfolio grows.
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
      subtitle="Equal-weight live return · click a point for the ticker"
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
          <ReturnLineChart points={filtered} height={240} interactive showMarkers />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-[var(--pf-gray-500)]">
            No data in this range.
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
