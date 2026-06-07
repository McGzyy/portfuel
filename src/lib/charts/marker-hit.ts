import type { ChartMarker } from "@/lib/charts/types";

export function candleDayStart(time: number): number {
  return Math.floor(time / 86400) * 86400;
}

/** Match a marker to crosshair/click time (daily markers vs intraday candles). */
export function markerNearTime(markers: ChartMarker[], time: number): ChartMarker | null {
  const exact = markers.find((m) => m.time === time);
  if (exact) return exact;

  const day = candleDayStart(time);
  const sameDay = markers.filter((m) => candleDayStart(m.time) === day);
  if (sameDay.length === 0) return null;

  return sameDay.reduce((best, m) =>
    Math.abs(m.time - time) < Math.abs(best.time - time) ? m : best
  );
}

export function markerLabelAtTime(markers: ChartMarker[], time: number): string | null {
  const hit = markerNearTime(markers, time);
  if (!hit) return null;
  return hit.label;
}
