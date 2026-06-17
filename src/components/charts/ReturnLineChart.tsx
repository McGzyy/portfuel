"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createChart,
  createSeriesMarkers,
  BaselineSeries,
  LineSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type SeriesMarker,
  type MouseEventParams,
} from "lightweight-charts";
import type { ReturnChartPoint, ChartMemberAvatar } from "@/lib/charts/types";
import { useIsDarkMode } from "@/components/appearance/AppearanceProvider";
import {
  activeChartTheme,
  chartGridOptions,
  chartLayoutOptions,
  type PfChartTheme,
} from "@/lib/charts/theme";
import { chartLocalizationOptions } from "@/lib/time/timestamp";
import { ChartAvatarOverlay, type ChartAvatarPin } from "@/components/charts/ChartAvatarOverlay";
import { returnPointsToAvatarPins } from "@/lib/charts/avatar-pins";
import { cn } from "@/lib/utils";

function markerForPoint(p: ReturnChartPoint, theme: PfChartTheme): SeriesMarker<Time> | null {
  if (!p.outcome) return null;
  return {
    time: p.time as Time,
    position: "inBar",
    price: p.value,
    shape: p.outcome === "win" ? "arrowUp" : p.outcome === "loss" ? "arrowDown" : "circle",
    color:
      p.outcome === "win"
        ? theme.marker.long
        : p.outcome === "loss"
          ? theme.marker.short
          : theme.marker.default,
    text: p.symbol ?? p.label,
  };
}

function filledSeriesOptions(theme: PfChartTheme, isDark: boolean) {
  return {
    baseValue: { type: "price" as const, price: 0 },
    lineWidth: 3 as const,
    topLineColor: theme.candle.up,
    bottomLineColor: theme.candle.down,
    topFillColor1: isDark ? "rgba(52, 211, 153, 0.28)" : "rgba(5, 150, 105, 0.24)",
    topFillColor2: isDark ? "rgba(52, 211, 153, 0.02)" : "rgba(5, 150, 105, 0.02)",
    bottomFillColor1: isDark ? "rgba(251, 113, 133, 0.02)" : "rgba(227, 27, 35, 0.02)",
    bottomFillColor2: isDark ? "rgba(251, 113, 133, 0.22)" : "rgba(227, 27, 35, 0.18)",
    priceLineVisible: true,
    lastValueVisible: true,
    crosshairMarkerRadius: 5,
  };
}

export function ReturnLineChart({
  points,
  height = 260,
  compact,
  interactive = false,
  showMarkers = false,
  showAvatars = false,
  memberAvatar,
  pinEmblem = "symbol",
  filled = false,
}: {
  points: ReturnChartPoint[];
  height?: number;
  compact?: boolean;
  /** Navigate to ticker on click when symbol is set. */
  interactive?: boolean;
  showMarkers?: boolean;
  /** Circular emblems at each call point (symbol logos or member avatars). */
  showAvatars?: boolean;
  memberAvatar?: ChartMemberAvatar | null;
  pinEmblem?: "member" | "symbol";
  /** Baseline fill above/below zero — hero performance charts. */
  filled?: boolean;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Baseline"> | null>(null);
  const markersRef = useRef<ReturnType<typeof createSeriesMarkers<Time>> | null>(null);
  const pointDataRef = useRef(points);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    pointDataRef.current = points;
  }, [points]);

  const isDark = useIsDarkMode();
  const chartTheme = activeChartTheme(isDark);
  const avatarPins = useMemo(
    () =>
      showAvatars
        ? returnPointsToAvatarPins(points, memberAvatar, { emblem: pinEmblem })
        : [],
    [showAvatars, points, memberAvatar, pinEmblem]
  );
  const useAvatarOverlay = showAvatars && avatarPins.length > 0;

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.layout.background },
        textColor: chartTheme.layout.text,
        fontFamily: chartLayoutOptions(chartTheme).fontFamily,
        fontSize: compact ? 10 : chartLayoutOptions(chartTheme).fontSize,
      },
      grid: chartGridOptions(chartTheme),
      width: containerRef.current.clientWidth,
      height,
      localization: chartLocalizationOptions(),
      timeScale: {
        borderColor: chartTheme.border,
        timeVisible: !compact,
        visible: !compact,
      },
      rightPriceScale: {
        borderColor: chartTheme.border,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    const series = filled
      ? chart.addSeries(BaselineSeries, filledSeriesOptions(chartTheme, isDark))
      : chart.addSeries(LineSeries, {
          color: chartTheme.candle.up,
          lineWidth: compact ? 2 : 2,
          priceLineVisible: !compact,
          lastValueVisible: true,
        });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series);
    setChartReady(true);

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
      setChartReady(false);
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, [height, compact, interactive, router, isDark, chartTheme, filled]);

  useEffect(() => {
    if (!seriesRef.current || points.length === 0) return;
    const data: LineData[] = points.map((p) => ({
      time: p.time as Time,
      value: p.value,
    }));
    seriesRef.current.setData(data);

    if (showMarkers && !useAvatarOverlay) {
      const seriesMarkers = points
        .map((p) => markerForPoint(p, chartTheme))
        .filter((m): m is SeriesMarker<Time> => m != null);
      markersRef.current?.setMarkers(seriesMarkers);
    } else {
      markersRef.current?.setMarkers([]);
    }

    chartRef.current?.timeScale().fitContent();
  }, [points, showMarkers, useAvatarOverlay, chartTheme]);

  const handleAvatarPinClick = (pin: ChartAvatarPin) => {
    if (!interactive) return;
    const hit = pointDataRef.current.find(
      (p) => (pin.callId && p.callId === pin.callId) || p.time === pin.time
    );
    if (hit?.symbol) {
      router.push(`/ticker/${hit.symbol}`);
    }
  };

  return (
    <div
      className={cn("relative overflow-hidden", interactive ? "cursor-pointer" : undefined)}
      style={{ height }}
      title={interactive ? "Click a point to open the ticker" : undefined}
    >
      <div ref={containerRef} className="h-full w-full" />
      {chartReady && useAvatarOverlay ? (
        <ChartAvatarOverlay
          chart={chartRef.current}
          series={seriesRef.current}
          pins={avatarPins}
          size={compact ? "sm" : "md"}
          containerRef={containerRef}
          onPinClick={interactive ? handleAvatarPinClick : undefined}
        />
      ) : null}
    </div>
  );
}
