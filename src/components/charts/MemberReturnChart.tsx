"use client";

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ChartRangeToolbar } from "@/components/charts/ChartRangeToolbar";
import { ReturnLineChart } from "@/components/charts/ReturnLineChart";
import type { ChartRangeKey, LinePoint } from "@/lib/charts/types";
import { filterLineByRange } from "@/lib/charts/range";
import { formatPct } from "@/lib/utils";

export function MemberReturnChart({
  points,
  className,
}: {
  points: LinePoint[];
  className?: string;
}) {
  const [range, setRange] = useState<ChartRangeKey>("all");
  const filtered = useMemo(
    () => filterLineByRange(points, range),
    [points, range]
  );

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

  return (
    <ChartFrame
      className={className}
      title="Cumulative return"
      subtitle="Running sum of marked-to-market returns on published calls"
    >
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChartRangeToolbar value={range} onChange={setRange} />
          {last != null ? (
            <p className="text-sm text-[var(--pf-gray-500)]">
              Total{" "}
              <span className={`font-bold tabular-nums ${lastAccent}`}>
                {formatPct(last)}
              </span>
            </p>
          ) : null}
        </div>
        {filtered.length > 0 ? (
          <ReturnLineChart points={filtered} height={260} />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-[var(--pf-gray-500)]">
            No data in this range.
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
