"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { markerHudAtTime, markerNearCallOnDay, markerNearTime, callMarkersOnDay, sameDayCallIds } from "@/lib/charts/marker-hit";
import { chartLocalizationOptions } from "@/lib/time/timestamp";
import { collapseDayCallMarkers, isClusterMarker } from "@/lib/charts/marker-clusters";
import { useIsDarkMode } from "@/components/appearance/AppearanceProvider";
import {
  activeChartTheme,
  chartGridOptions,
  chartLayoutOptions,
} from "@/lib/charts/theme";
import { cn, formatPrice } from "@/lib/utils";
import type { ChartCallPreview } from "@/lib/charts/chart-call-preview";
import { ChartCallHoverTip } from "@/components/charts/ChartCallHoverTip";
import { ChartAvatarOverlay } from "@/components/charts/ChartAvatarOverlay";
import { tickerMarkersToAvatarPins } from "@/lib/charts/avatar-pins";

export type { CandlePoint, ChartMarker } from "@/lib/charts/types";

const SMA_COLOR = "#2563eb";
const VWAP_COLOR = "#7c3aed";

type CrosshairHud = {
  open: number;
  high: number;
  low: number;
  close: number;
  markerLabel: string | null;
  callCount: number;
};

function markerShape(m: ChartMarker): SeriesMarker<Time>["shape"] {
  if ((m.clusterCount ?? 0) > 1) return "circle";
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

function hudFromCandle(
  candle: CandlePoint,
  markerLabel: string | null,
  callCount: number
): CrosshairHud {
  return {
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    markerLabel,
    callCount,
  };
}

function hudForTime(
  candle: CandlePoint,
  markers: ChartMarker[],
  time: number,
  price?: number | null
): CrosshairHud {
  const { label, callCount } = markerHudAtTime(markers, time, price ?? candle.close);
  return hudFromCandle(candle, label, callCount);
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
      {hud.callCount > 0 || hud.markerLabel ? (
        <span className="inline-flex min-w-0 items-center gap-1 border-l border-[var(--pf-border)] pl-3 text-[var(--pf-gray-600)]">
          <span className="font-semibold text-[var(--pf-gray-400)]">Call</span>
          {hud.callCount > 1 ? (
            <span className="truncate font-medium text-[var(--pf-black)]">
              {hud.callCount} calls
              {hud.markerLabel ? (
                <span className="text-[var(--pf-gray-500)]"> · {hud.markerLabel}</span>
              ) : null}
            </span>
          ) : (
            <span className="truncate font-medium text-[var(--pf-black)]">{hud.markerLabel}</span>
          )}
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
  onCallMarkerClick?: (callId: string, sameDayCallIds: string[]) => void;
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
  const [chartReady, setChartReady] = useState(false);
  const [markerHover, setMarkerHover] = useState<{
    callId: string;
    x: number;
    y: number;
    moreOnDay: number;
  } | null>(null);
  const isDark = useIsDarkMode();
  const chartTheme = activeChartTheme(isDark);
  const avatarPins = useMemo(() => tickerMarkersToAvatarPins(markers), [markers]);

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
      setCrosshairHud(hudForTime(last, markers, last.time));
    } else {
      setCrosshairHud(null);
    }
  }, [candles, markers]);

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
      height: showVolume ? 440 : chartTheme.height,
      localization: chartLocalizationOptions(),
      timeScale: {
        borderColor: chartTheme.border,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: chartTheme.border,
        scaleMargins: showVolume ? { top: 0.06, bottom: 0.28 } : { top: 0.08, bottom: 0.12 },
      },
      crosshair: {
        vertLine: {
          color: isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(15, 20, 25, 0.12)",
          labelBackgroundColor: isDark ? "#334155" : "#0f1419",
        },
        horzLine: {
          color: isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(15, 20, 25, 0.12)",
          labelBackgroundColor: isDark ? "#334155" : "#0f1419",
        },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: chartTheme.candle.up,
      downColor: chartTheme.candle.down,
      borderUpColor: chartTheme.candle.up,
      borderDownColor: chartTheme.candle.down,
      wickUpColor: chartTheme.candle.wickUp,
      wickDownColor: chartTheme.candle.wickDown,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series);
    setChartReady(true);

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
      time: number,
      price?: number | null
    ) => {
      if (!callPreviewsRef.current || !param.point) {
        setMarkerHover(null);
        return;
      }
      const hit = markerNearCallOnDay(markerDataRef.current, time, price);
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
          setCrosshairHud(hudForTime(last, markerDataRef.current, last.time));
        }
        return;
      }

      const t = param.time as number;
      const seriesData = param.seriesData.get(series);
      const bar = seriesData as CandlestickData | undefined;
      const crosshairPrice = bar?.close ?? bar?.open ?? null;
      emitMarkerHover(param, t, crosshairPrice);
      if (!bar || bar.open == null) {
        const fallback = candlesRef.current.find((c) => c.time === t);
        if (fallback) {
          setCrosshairHud(
            hudForTime(fallback, markerDataRef.current, t, crosshairPrice)
          );
        }
        return;
      }

      const { label, callCount } = markerHudAtTime(markerDataRef.current, t, crosshairPrice);
      setCrosshairHud({
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        markerLabel: label,
        callCount,
      });
    };

    const onClick = (param: MouseEventParams<Time>) => {
      if (param.time == null) return;
      const t = param.time as number;
      const seriesData = param.seriesData.get(series);
      const bar = seriesData as CandlestickData | undefined;
      const crosshairPrice = bar?.close ?? bar?.open ?? null;
      const journalHit = markerNearTime(markerDataRef.current, t);
      if (journalHit?.journalEntryId) {
        const el = document.getElementById(`journal-entry-${journalHit.journalEntryId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.classList.add("pf-thesis-highlight");
        window.setTimeout(() => el?.classList.remove("pf-thesis-highlight"), 2200);
        return;
      }

      const hit =
        markerNearCallOnDay(markerDataRef.current, t, crosshairPrice) ??
        markerNearCallOnDay(markerDataRef.current, t);
      if (!hit?.callId) return;
      if (onCallMarkerClickRef.current) {
        onCallMarkerClickRef.current(hit.callId, sameDayCallIds(markerDataRef.current, t));
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
      setChartReady(false);
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
      smaRef.current = null;
      vwapRef.current = null;
      markersRef.current = null;
      priceLinesRef.current = [];
    };
  }, [showVolume, isDark]);

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

    const displayMarkers = collapseDayCallMarkers(markers);
    const nativeMarkers = displayMarkers.filter((m) => !m.callId || m.kind === "journal");
    const seriesMarkers: SeriesMarker<Time>[] = nativeMarkers.map((m) => ({
      time: m.time as Time,
      position: markerPosition(m),
      price: m.price,
      color: m.color ?? chartTheme.marker.default,
      shape: markerShape(m),
      text: m.kind === "journal" ? m.label : isClusterMarker(m) ? `${m.clusterCount} calls` : m.label,
    }));
    markersRef.current?.setMarkers(seriesMarkers);

    for (const pl of priceLinesRef.current) {
      seriesRef.current.removePriceLine(pl);
    }
    priceLinesRef.current = [];

    for (const line of priceLines) {
      const pl = seriesRef.current.createPriceLine({
        price: line.price,
        color: line.color ?? chartTheme.marker.default,
        lineWidth: line.lineWidth ?? (line.label.toLowerCase().includes("entry") ? 2 : 1),
        lineStyle: line.style === "dashed" ? LineStyle.Dashed : LineStyle.Solid,
        axisLabelVisible: true,
        title: line.label,
      });
      priceLinesRef.current.push(pl);
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, markers, priceLines, showVolume, smaPoints, vwapPoints]);

  const h = showVolume ? 440 : chartTheme.height;
  const hoverCall =
    markerHover && callPreviewsById ? callPreviewsById[markerHover.callId] : null;

  const handleAvatarPinClick = useCallback(
    (pin: { callId?: string; time: number }) => {
      if (!pin.callId) return;
      if (onCallMarkerClickRef.current) {
        onCallMarkerClickRef.current(pin.callId, sameDayCallIds(markerDataRef.current, pin.time));
        return;
      }
      const el = document.getElementById(`thesis-${pin.callId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.classList.add("pf-thesis-highlight");
      window.setTimeout(() => el?.classList.remove("pf-thesis-highlight"), 2200);
    },
    []
  );

  return (
    <div className="space-y-2">
      <ChartCrosshairBar hud={crosshairHud} />
      <div className="relative overflow-hidden rounded-lg border border-[var(--pf-border)]/80 bg-[var(--pf-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <div ref={containerRef} className={cn("w-full min-h-[320px]")} style={{ height: h }} />
        {chartReady && avatarPins.length > 0 ? (
          <ChartAvatarOverlay
            chart={chartRef.current}
            series={seriesRef.current}
            pins={avatarPins}
            containerRef={containerRef}
            onPinClick={handleAvatarPinClick}
          />
        ) : null}
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
