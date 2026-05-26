"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CandlestickSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type SeriesMarker,
  type IPriceLine,
  type MouseEventParams,
} from "lightweight-charts";
import type { CandlePoint, ChartMarker, PriceLine } from "@/lib/charts/types";
import {
  PF_CHART,
  chartGridOptions,
  chartLayoutOptions,
} from "@/lib/charts/theme";

export type { CandlePoint, ChartMarker } from "@/lib/charts/types";

function markerShape(m: ChartMarker): SeriesMarker<Time>["shape"] {
  if (m.kind === "fueled") return "square";
  if (m.kind === "long") return "arrowUp";
  if (m.kind === "short") return "arrowDown";
  return "circle";
}

function markerPosition(m: ChartMarker): SeriesMarker<Time>["position"] {
  if (m.kind === "long") return "belowBar";
  if (m.kind === "short") return "aboveBar";
  return "aboveBar";
}

export function TickerChart({
  candles,
  markers,
  priceLines = [],
}: {
  candles: CandlePoint[];
  markers: ChartMarker[];
  priceLines?: PriceLine[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const markerDataRef = useRef(markers);

  useEffect(() => {
    markerDataRef.current = markers;
  }, [markers]);

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

    const onClick = (param: MouseEventParams<Time>) => {
      if (param.time == null) return;
      const t = param.time as number;
      const hit = markerDataRef.current.find((m) => m.time === t && m.callId);
      if (!hit?.callId) return;
      const el = document.getElementById(`thesis-${hit.callId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.classList.add("pf-thesis-highlight");
      window.setTimeout(() => el?.classList.remove("pf-thesis-highlight"), 2200);
    };
    chart.subscribeClick(onClick);

    return () => {
      chart.unsubscribeClick(onClick);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
      priceLinesRef.current = [];
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
      position: markerPosition(m),
      price: m.price,
      color: m.color ?? PF_CHART.marker.default,
      shape: markerShape(m),
      text: m.label,
    }));
    markersRef.current?.setMarkers(seriesMarkers);

    for (const pl of priceLinesRef.current) {
      seriesRef.current.removePriceLine(pl);
    }
    priceLinesRef.current = [];

    for (const line of priceLines) {
      const pl = seriesRef.current.createPriceLine({
        price: line.price,
        color: line.color ?? PF_CHART.marker.default,
        lineWidth: 1,
        lineStyle: line.style === "dashed" ? LineStyle.Dashed : LineStyle.Solid,
        axisLabelVisible: true,
        title: line.label,
      });
      priceLinesRef.current.push(pl);
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, markers, priceLines]);

  return <div ref={containerRef} className="h-[400px] w-full min-h-[320px]" />;
}
