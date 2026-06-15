"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";
import {
  ChartAvatarEmblem,
  type ChartAvatarEmblemKind,
} from "@/components/charts/ChartAvatarEmblem";
import { cn } from "@/lib/utils";

export type ChartAvatarPin = {
  time: number;
  price: number;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  kind?: ChartAvatarEmblemKind;
  clusterCount?: number;
  callId?: string;
  /** long/short/fueled placement on ticker charts */
  placement?: "above" | "below" | "on";
};

type PlacedPin = ChartAvatarPin & { x: number; y: number };

function pinOffsetY(placement: ChartAvatarPin["placement"], size: "sm" | "md"): number {
  const half = size === "sm" ? 11 : 13;
  if (placement === "below") return half + 6;
  if (placement === "above") return -(half + 6);
  return -half;
}

export function ChartAvatarOverlay({
  chart,
  series,
  pins,
  size = "md",
  className,
  onPinClick,
  containerRef,
}: {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Baseline"> | null;
  pins: ChartAvatarPin[];
  size?: "sm" | "md";
  className?: string;
  onPinClick?: (pin: ChartAvatarPin) => void;
  containerRef?: RefObject<HTMLElement | null>;
}) {
  const [placed, setPlaced] = useState<PlacedPin[]>([]);

  const recompute = useCallback(() => {
    if (!chart || !series || pins.length === 0) {
      setPlaced([]);
      return;
    }

    const timeScale = chart.timeScale();
    const next: PlacedPin[] = [];

    for (const pin of pins) {
      const x = timeScale.timeToCoordinate(pin.time as Time);
      const y = series.priceToCoordinate(pin.price);
      if (x == null || y == null) continue;
      next.push({
        ...pin,
        x,
        y: y + pinOffsetY(pin.placement ?? "on", size),
      });
    }

    setPlaced(next);
  }, [chart, series, pins, size]);

  useEffect(() => {
    recompute();
    if (!chart) return;

    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange(recompute);
    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(recompute);
    };
  }, [chart, recompute]);

  useEffect(() => {
    if (!chart) return;
    const container = containerRef?.current;
    if (!container) return;

    const ro = new ResizeObserver(() => recompute());
    ro.observe(container);
    return () => ro.disconnect();
  }, [chart, containerRef, recompute]);

  if (placed.length === 0) return null;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-10 overflow-hidden", className)}
      aria-hidden={!onPinClick}
    >
      {placed.map((pin) => (
        <button
          key={`${pin.time}-${pin.callId ?? pin.username}-${pin.price}`}
          type="button"
          className={cn(
            "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pf-red)]",
            onPinClick ? "cursor-pointer" : "cursor-default"
          )}
          style={{ left: pin.x, top: pin.y }}
          title={pin.displayName?.trim() || `@${pin.username}`}
          onClick={
            onPinClick
              ? (e) => {
                  e.stopPropagation();
                  onPinClick(pin);
                }
              : undefined
          }
          tabIndex={onPinClick ? 0 : -1}
        >
          <ChartAvatarEmblem
            username={pin.username}
            displayName={pin.displayName}
            avatarUrl={pin.avatarUrl}
            kind={pin.kind ?? "long"}
            size={size}
            clusterCount={pin.clusterCount}
          />
        </button>
      ))}
    </div>
  );
}
