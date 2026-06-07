"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  type SeriesMarker,
  type IPriceLine,
  type MouseEventParams,
  type HistogramData,
  type LineData,
} from "lightweight-charts";
import type { CandlePoint, ChartMarker, LinePoint, PriceLine } from "@/lib/charts/types";
import { markerLabelAtTime, markerNearTime, callMarkersOnDay } from "@/lib/charts/marker-hit";
import {
  PF_CHART,
  chartGridOptions,
  chartLayoutOptions,
} from "@/lib/charts/theme";
import { cn, formatPrice } from "@/lib/utils";
import type { ChartCallPreview } from "@/lib/charts/chart-call-preview";
import { ChartCallHoverTip } from "@/components/charts/ChartCallHoverTip";

export type { CandlePoint, ChartMarker } from "@/lib/charts/types";

const SMA_COLOR = "#2563eb";
const VWAP_COLOR = "#7c3aed";

type CrosshairHud = {
  open: number;
  high: number;
  low: number;
  close: number;
  markerLabel: string | null;
};

function markerShape(m: ChartMarker): SeriesMarker<Time>["shape"] {
  if (m.kind === "fueled") return "square";
  if (m.kind === "long") return "arrowUp";
  if (m.kind === "short") return "arrowDown";
  if (m.kind === "journal") return "circle";
  return "circle";
}

function markerPosition(m: ChartMarker): SeriesMarker<Time>["position"] {
  if (m.kind === "long") return "belowBar";
  if (m.kind === "short") return "aboveBar";
  if (m.kind === "journal") return "belowBar";
  return "aboveBar";
}

function hudFromCandle(candle: CandlePoint, markerLabel: string | null): CrosshairHud {
  return {
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    markerLabel,
  };
}

function OhlcStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-semibold text-[var(--pf-gray-400)]">{label}</span>
      <span className="font-mono tabular-nums text-[var(--pf-black)]">{formatPrice(value)}</span>
    </span>
  );
}

function ChartCrosshairBar({ hud }: { hud: CrosshairHud | null }) {
  if (!hud) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-1.5 text-[11px]"
      aria-live="polite"
    >
      <OhlcStat label="O" value={hud.open} />
      <OhlcStat label="H" value={hud.high} />
      <OhlcStat label="L" value={hud.low} />
      <OhlcStat label="C" value={hud.close} />
      {hud.markerLabel ? (
        <span className="inline-flex min-w-0 items-center gap-1 border-l border-[var(--pf-border)] pl-3 text-[var(--pf-gray-600)]">
          <span className="font-semibold text-[var(--pf-gray-400)]">Call</span>
          <span className="truncate font-medium text-[var(--pf-black)]">{hud.markerLabel}</span>
        </span>
      ) : null}
    </div>
  );
}

export function TickerChart({
  candles,
  markers,
  priceLines = [],
  showVolume = true,
  smaPoints = [],
  vwapPoints = [],
  callPreviewsById,
  onCallMarkerClick,
}: {
  candles: CandlePoint[];
  markers: ChartMarker[];
  priceLines?: PriceLine[];
  showVolume?: boolean;
  smaPoints?: LinePoint[];
  vwapPoints?: LinePoint[];
  callPreviewsById?: Record<string, ChartCallPreview>;
  /** Opens in-page call modal instead of scrolling to thesis block. */
  onCallMarkerClick?: (callId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const smaRef = useRef<ISeriesApi<"Line"> | null>(null);
  const vwapRef = useRef<ISeriesApi<"Line"> | null>(null);
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const markerDataRef = useRef(markers);
  const candlesRef = useRef(candles);
  const onCallMarkerClickRef = useRef(onCallMarkerClick);
  const callPreviewsRef = useRef(callPreviewsById);
  const [crosshairHud, setCrosshairHud] = useState<CrosshairHud | null>(null);
  const [markerHover, setMarkerHover] = useState<{
    callId: string;
    x: number;
    y: number;
    moreOnDay: number;
  } | null>(null);

  useEffect(() => {
    onCallMarkerClickRef.current = onCallMarkerClick;
  }, [onCallMarkerClick]);

  useEffect(() => {
    callPreviewsRef.current = callPreviewsById;
  }, [callPreviewsById]);

  useEffect(() => {
    markerDataRef.current = markers;
  }, [markers]);

  useEffect(() => {
    candlesRef.current = candles;
    const last = candles[candles.length - 1];
    if (last) {
      setCrosshairHud(hudFromCandle(last, markerLabelAtTime(markers, last.time)));
    } else {
      setCrosshairHud(null);
    }
  }, [candles, markers]);

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
      height: showVolume ? 440 : PF_CHART.height,
      timeScale: {
        borderColor: PF_CHART.border,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: PF_CHART.border,
        scaleMargins: showVolume ? { top: 0.06, bottom: 0.28 } : { top: 0.08, bottom: 0.12 },
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

    if (showVolume) {
      const vol = chart.addSeries(HistogramSeries, {
        color: "#94a3b8",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
      });
      volumeRef.current = vol;
    }

    smaRef.current = chart.addSeries(LineSeries, {
      color: SMA_COLOR,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "SMA 20",
    });

    vwapRef.current = chart.addSeries(LineSeries, {
      color: VWAP_COLOR,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "VWAP",
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    const emitMarkerHover = (
      param: MouseEventParams<Time>,
      time: number
    ) => {
      if (!callPreviewsRef.current || !param.point) {
        setMarkerHover(null);
        return;
      }
      const hit = markerNearTime(markerDataRef.current, time);
      if (!hit?.callId || !callPreviewsRef.current[hit.callId]) {
        setMarkerHover(null);
        return;
      }
      const sameDay = callMarkersOnDay(markerDataRef.current, time);
      setMarkerHover({
        callId: hit.callId,
        x: param.point.x,
        y: param.point.y,
        moreOnDay: Math.max(0, sameDay.length - 1),
      });
    };

    const onCrosshairMove = (param: MouseEventParams<Time>) => {
      if (param.time == null || !param.point) {
        setMarkerHover(null);
        const last = candlesRef.current[candlesRef.current.length - 1];
        if (last) {
          setCrosshairHud(
            hudFromCandle(last, markerLabelAtTime(markerDataRef.current, last.time))
          );
        }
        return;
      }

      const t = param.time as number;
      emitMarkerHover(param, t);
      const seriesData = param.seriesData.get(series);
      const bar = seriesData as CandlestickData | undefined;
      if (!bar || bar.open == null) {
        const fallback = candlesRef.current.find((c) => c.time === t);
        if (fallback) {
          setCrosshairHud(
            hudFromCandle(fallback, markerLabelAtTime(markerDataRef.current, t))
          );
        }
        return;
      }

      setCrosshairHud({
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        markerLabel: markerLabelAtTime(markerDataRef.current, t),
      });
    };

    const onClick = (param: MouseEventParams<Time>) => {
      if (param.time == null) return;
      const t = param.time as number;
      const hit = markerNearTime(markerDataRef.current, t);
      if (!hit?.callId && !hit?.journalEntryId) return;

      if (hit.journalEntryId) {
        const el = document.getElementById(`journal-entry-${hit.journalEntryId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.classList.add("pf-thesis-highlight");
        window.setTimeout(() => el?.classList.remove("pf-thesis-highlight"), 2200);
        return;
      }
      if (!hit.callId) return;
      if (onCallMarkerClickRef.current) {
        onCallMarkerClickRef.current(hit.callId);
        return;
      }
      const el = document.getElementById(`thesis-${hit.callId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.classList.add("pf-thesis-highlight");
      window.setTimeout(() => el?.classList.remove("pf-thesis-highlight"), 2200);
    };

    chart.subscribeCrosshairMove(onCrosshairMove);
    chart.subscribeClick(onClick);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.unsubscribeClick(onClick);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
      smaRef.current = null;
      vwapRef.current = null;
      markersRef.current = null;
      priceLinesRef.current = [];
    };
  }, [showVolume]);

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

    if (volumeRef.current && showVolume) {
      const volData: HistogramData[] = candles.map((c) => ({
        time: c.time as Time,
        value: c.volume ?? 0,
        color:
          c.close >= c.open ? "rgba(5, 150, 105, 0.35)" : "rgba(227, 27, 35, 0.35)",
      }));
      volumeRef.current.setData(volData);
    }

    if (smaRef.current) {
      const smaData: LineData[] = smaPoints.map((p) => ({
        time: p.time as Time,
        value: p.value,
      }));
      smaRef.current.setData(smaData);
      smaRef.current.applyOptions({ visible: smaPoints.length > 0 });
    }

    if (vwapRef.current) {
      const vwapData: LineData[] = vwapPoints.map((p) => ({
        time: p.time as Time,
        value: p.value,
      }));
      vwapRef.current.setData(vwapData);
      vwapRef.current.applyOptions({ visible: vwapPoints.length > 0 });
    }

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
  }, [candles, markers, priceLines, showVolume, smaPoints, vwapPoints]);

  const h = showVolume ? 440 : PF_CHART.height;
  const hoverCall =
    markerHover && callPreviewsById ? callPreviewsById[markerHover.callId] : null;

  return (
    <div className="space-y-2">
      <ChartCrosshairBar hud={crosshairHud} />
      <div className="relative">
        <div ref={containerRef} className={cn("w-full min-h-[320px]")} style={{ height: h }} />
        {hoverCall && markerHover ? (
          <ChartCallHoverTip
            call={hoverCall}
            x={markerHover.x}
            y={markerHover.y}
            moreOnDay={markerHover.moreOnDay}
          />
        ) : null}
      </div>
    </div>
  );
}
