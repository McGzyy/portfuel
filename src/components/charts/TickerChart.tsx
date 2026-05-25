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
import {
  PF_CHART,
  chartGridOptions,
  chartLayoutOptions,
} from "@/lib/charts/theme";

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
        background: { type: ColorType.Solid, color: PF_CHART.layout.background },
        textColor: PF_CHART.layout.text,
        fontFamily: chartLayoutOptions().fontFamily,
        fontSize: chartLayoutOptions().fontSize,
      },
      grid: chartGridOptions(),
      width: containerRef.current.clientWidth,
      height: PF_CHART.height,
      timeScale: {
        borderColor: PF_CHART.border,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: PF_CHART.border,
        scaleMargins: { top: 0.08, bottom: 0.12 },
      },
      crosshair: {
        vertLine: { color: "rgba(15, 20, 25, 0.12)", labelBackgroundColor: "#0f1419" },
        horzLine: { color: "rgba(15, 20, 25, 0.12)", labelBackgroundColor: "#0f1419" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: PF_CHART.candle.up,
      downColor: PF_CHART.candle.down,
      borderUpColor: PF_CHART.candle.up,
      borderDownColor: PF_CHART.candle.down,
      wickUpColor: PF_CHART.candle.wickUp,
      wickDownColor: PF_CHART.candle.wickDown,
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
      color: m.color ?? PF_CHART.marker.default,
      shape: "circle",
      text: m.label,
    }));
    markersRef.current?.setMarkers(seriesMarkers);

    chartRef.current?.timeScale().fitContent();
  }, [candles, markers]);

  return <div ref={containerRef} className="h-[400px] w-full min-h-[320px]" />;
}
