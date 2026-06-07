"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import type { LinePoint, PriceLine } from "@/lib/charts/types";
import { useIsDarkMode } from "@/components/appearance/AppearanceProvider";
import {
  activeChartTheme,
  chartGridOptions,
  chartLayoutOptions,
} from "@/lib/charts/theme";

const SERIES_COLORS = ["#e31b23", "#059669", "#2563eb"] as const;

export type CompareSeries = {
  symbol: string;
  points: LinePoint[];
  priceLines?: PriceLine[];
};

export function CompareMultiLineChart({
  series,
  height = 320,
}: {
  series: CompareSeries[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineRefs = useRef<ISeriesApi<"Line">[]>([]);

  const isDark = useIsDarkMode();
  const chartTheme = activeChartTheme(isDark);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.layout.background },
        textColor: chartTheme.layout.text,
        fontFamily: chartLayoutOptions(chartTheme).fontFamily,
        fontSize: chartLayoutOptions(chartTheme).fontSize,
      },
      grid: chartGridOptions(chartTheme),
      width: containerRef.current.clientWidth,
      height,
      timeScale: {
        borderColor: chartTheme.border,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: chartTheme.border,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      crosshair: {
        vertLine: {
          color: isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(15, 20, 25, 0.15)",
          labelBackgroundColor: isDark ? "#334155" : "#0f1419",
        },
        horzLine: {
          color: isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(15, 20, 25, 0.15)",
          labelBackgroundColor: isDark ? "#334155" : "#0f1419",
        },
      },
    });

    chartRef.current = chart;
    lineRefs.current = [];

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
      lineRefs.current = [];
    };
  }, [height, isDark]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || series.length === 0) return;

    for (const s of lineRefs.current) {
      chart.removeSeries(s);
    }
    lineRefs.current = [];

    for (let i = 0; i < series.length; i++) {
      const slot = series[i];
      const line = chart.addSeries(LineSeries, {
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: slot.symbol,
      });
      const data: LineData[] = slot.points.map((p) => ({
        time: p.time as Time,
        value: p.value,
      }));
      line.setData(data);
      lineRefs.current.push(line);

      for (const level of slot.priceLines ?? []) {
        line.createPriceLine({
          price: level.price,
          color: level.color ?? SERIES_COLORS[i % SERIES_COLORS.length],
          lineWidth: 1,
          lineStyle: level.style === "dashed" ? LineStyle.Dashed : LineStyle.Solid,
          axisLabelVisible: true,
          title: level.label,
        });
      }
    }

    chart.timeScale().fitContent();
  }, [series]);

  if (series.length < 2) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3 px-1">
        {series.map((s, i) => (
          <span key={s.symbol} className="inline-flex items-center gap-1.5 text-xs font-semibold">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            <span className="font-mono text-[var(--pf-black)]">{s.symbol}</span>
          </span>
        ))}
      </div>
      <div ref={containerRef} className="w-full" style={{ height }} />
    </div>
  );
}
