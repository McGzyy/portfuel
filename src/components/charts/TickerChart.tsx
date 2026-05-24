"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type SeriesMarker,
} from "lightweight-charts";

export type ChartMarker = {
  time: number;
  price: number;
  label: string;
  color?: string;
};

export type CandlePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export function TickerChart({
  candles,
  markers,
}: {
  candles: CandlePoint[];
  markers: ChartMarker[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#374151",
      },
      grid: {
        vertLines: { color: "#f3f4f6" },
        horzLines: { color: "#f3f4f6" },
      },
      width: containerRef.current.clientWidth,
      height: 380,
      timeScale: { borderColor: "#e5e7eb" },
      rightPriceScale: { borderColor: "#e5e7eb" },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#e31b23",
      borderUpColor: "#10b981",
      borderDownColor: "#e31b23",
      wickUpColor: "#10b981",
      wickDownColor: "#e31b23",
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

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    seriesRef.current.setData(data);

    const seriesMarkers: SeriesMarker<Time>[] = markers.map((m) => ({
      time: m.time as Time,
      position: "aboveBar",
      color: m.color ?? "#E31B23",
      shape: "circle",
      text: m.label,
    }));
    markersRef.current?.setMarkers(seriesMarkers);

    chartRef.current?.timeScale().fitContent();
  }, [candles, markers]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl border border-[var(--pf-border)]"
    />
  );
}
