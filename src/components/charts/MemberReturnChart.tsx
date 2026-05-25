"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  LineSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ChartRangeToolbar } from "@/components/charts/ChartRangeToolbar";
import type { ChartRangeKey, LinePoint } from "@/lib/charts/types";
import { filterLineByRange } from "@/lib/charts/range";
import {
  PF_CHART,
  chartGridOptions,
  chartLayoutOptions,
} from "@/lib/charts/theme";
import { formatPct } from "@/lib/utils";

const CHART_HEIGHT = 260;

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
        subtitle="Running sum of returns on published calls"
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
          <MemberReturnLineChart points={filtered} />
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-[var(--pf-gray-500)]">
            No data in this range.
          </div>
        )}
      </div>
    </ChartFrame>
  );
}

function MemberReturnLineChart({ points }: { points: LinePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: PF_CHART.layout.background },
        textColor: PF_CHART.layout.text,
        fontFamily: chartLayoutOptions().fontFamily,
        fontSize: chartLayoutOptions().fontSize,
      },
      grid: chartGridOptions(),
      width: containerRef.current.clientWidth,
      height: CHART_HEIGHT,
      timeScale: {
        borderColor: PF_CHART.border,
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: PF_CHART.border,
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: PF_CHART.candle.up,
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || points.length === 0) return;
    const data: LineData[] = points.map((p) => ({
      time: p.time as Time,
      value: p.value,
    }));
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  return <div ref={containerRef} className="w-full" style={{ height: CHART_HEIGHT }} />;
}
