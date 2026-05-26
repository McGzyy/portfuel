"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createChart,
  createSeriesMarkers,
  LineSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type SeriesMarker,
  type MouseEventParams,
} from "lightweight-charts";
import type { ReturnChartPoint } from "@/lib/charts/types";
import {
  PF_CHART,
  chartGridOptions,
  chartLayoutOptions,
} from "@/lib/charts/theme";

function markerForPoint(p: ReturnChartPoint): SeriesMarker<Time> | null {
  if (!p.outcome) return null;
  return {
    time: p.time as Time,
    position: "inBar",
    price: p.value,
    shape: p.outcome === "win" ? "arrowUp" : p.outcome === "loss" ? "arrowDown" : "circle",
    color:
      p.outcome === "win"
        ? PF_CHART.marker.long
        : p.outcome === "loss"
          ? PF_CHART.marker.short
          : PF_CHART.marker.default,
    text: p.symbol ?? p.label,
  };
}

export function ReturnLineChart({
  points,
  height = 260,
  compact,
  interactive = false,
  showMarkers = false,
}: {
  points: ReturnChartPoint[];
  height?: number;
  compact?: boolean;
  /** Navigate to ticker on click when symbol is set. */
  interactive?: boolean;
  showMarkers?: boolean;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);
  const pointDataRef = useRef(points);

  useEffect(() => {
    pointDataRef.current = points;
  }, [points]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: PF_CHART.layout.background },
        textColor: PF_CHART.layout.text,
        fontFamily: chartLayoutOptions().fontFamily,
        fontSize: compact ? 10 : chartLayoutOptions().fontSize,
      },
      grid: chartGridOptions(),
      width: containerRef.current.clientWidth,
      height,
      timeScale: {
        borderColor: PF_CHART.border,
        timeVisible: !compact,
        visible: !compact,
      },
      rightPriceScale: {
        borderColor: PF_CHART.border,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    const series = chart.addSeries(LineSeries, {
      color: PF_CHART.candle.up,
      lineWidth: compact ? 2 : 2,
      priceLineVisible: !compact,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series);

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    const onClick = (param: MouseEventParams<Time>) => {
      if (!interactive || param.time == null) return;
      const t = param.time as number;
      const hit = pointDataRef.current.find((p) => p.time === t && p.symbol);
      if (hit?.symbol) {
        router.push(`/ticker/${hit.symbol}`);
      }
    };
    chart.subscribeClick(onClick);

    return () => {
      chart.unsubscribeClick(onClick);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, [height, compact, interactive, router]);

  useEffect(() => {
    if (!seriesRef.current || points.length === 0) return;
    const data: LineData[] = points.map((p) => ({
      time: p.time as Time,
      value: p.value,
    }));
    seriesRef.current.setData(data);

    if (showMarkers) {
      const seriesMarkers = points
        .map(markerForPoint)
        .filter((m): m is SeriesMarker<Time> => m != null);
      markersRef.current?.setMarkers(seriesMarkers);
    } else {
      markersRef.current?.setMarkers([]);
    }

    chartRef.current?.timeScale().fitContent();
  }, [points, showMarkers]);

  return (
    <div
      ref={containerRef}
      className={interactive ? "cursor-pointer" : undefined}
      style={{ height }}
      title={interactive ? "Click a point to open the ticker" : undefined}
    />
  );
}
