"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ChartRangeToolbar } from "@/components/charts/ChartRangeToolbar";
import { ChartLoadingSkeleton } from "@/components/charts/ChartLoadingSkeleton";
import { TickerChartLegend } from "@/components/ticker/TickerChartLegend";
import type { CandlePoint, ChartMarker, ChartRangeKey, PriceLine } from "@/lib/charts/types";
import { filterCandlesByRange, filterMarkersByRange } from "@/lib/charts/range";

const TickerChart = dynamic(
  () => import("@/components/charts/TickerChart").then((m) => m.TickerChart),
  {
    ssr: false,
    loading: () => <ChartLoadingSkeleton height={400} />,
  }
);

export function TickerChartSection({
  candles,
  markers,
  priceLines = [],
  className,
}: {
  candles: CandlePoint[];
  markers: ChartMarker[];
  priceLines?: PriceLine[];
  className?: string;
}) {
  const [range, setRange] = useState<ChartRangeKey>("1y");

  const filteredCandles = useMemo(
    () => filterCandlesByRange(candles, range),
    [candles, range]
  );
  const filteredMarkers = useMemo(
    () => filterMarkersByRange(markers, range),
    [markers, range]
  );

  const hasData = candles.length > 0;

  return (
    <ChartFrame
      className={className}
      title="Price history"
      subtitle="Member call markers · adjust range"
      legend={
        hasData ? (
          <TickerChartLegend callCount={filteredMarkers.length} embedded />
        ) : undefined
      }
    >
      {hasData ? (
        <div className="space-y-3 p-3">
          <ChartRangeToolbar value={range} onChange={setRange} />
          {filteredCandles.length > 0 ? (
            <TickerChart
              candles={filteredCandles}
              markers={filteredMarkers}
              priceLines={priceLines}
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-[var(--pf-gray-500)]">
              No candles in this range — try a wider window.
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--pf-gray-500)]">
          <p className="font-medium text-[var(--pf-gray-600)]">Chart unavailable</p>
          <p className="max-w-sm text-xs">
            Price history loads from market data. Check your API key or try another symbol.
          </p>
        </div>
      )}
    </ChartFrame>
  );
}
