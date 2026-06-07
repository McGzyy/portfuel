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

/** Community call markers on the same calendar day (for stacked-day hints). */
export function callMarkersOnDay(markers: ChartMarker[], time: number): ChartMarker[] {
  const day = candleDayStart(time);
  return markers.filter((m) => m.callId && candleDayStart(m.time) === day);
}

/** Pick the nearest same-day call marker, optionally by chart price (crosshair Y). */
export function markerNearCallOnDay(
  markers: ChartMarker[],
  time: number,
  price?: number | null
): ChartMarker | null {
  const sameDay = callMarkersOnDay(markers, time);
  if (sameDay.length === 0) return null;
  if (sameDay.length === 1) return sameDay[0];

  if (price != null && Number.isFinite(price)) {
    return sameDay.reduce((best, m) =>
      Math.abs(m.price - price) < Math.abs(best.price - price) ? m : best
    );
  }

  return sameDay[0];
}

export function sameDayCallIds(markers: ChartMarker[], time: number): string[] {
  return callMarkersOnDay(markers, time)
    .map((m) => m.callId)
    .filter((id): id is string => Boolean(id));
}
