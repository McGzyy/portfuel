import type { CandlePoint, ChartMarker, ChartRangeKey, LinePoint } from "@/lib/charts/types";
import { CHART_RANGE_SECONDS } from "@/lib/charts/types";

export function rangeCutoffSec(range: ChartRangeKey): number | null {
  if (range === "all") return null;
  return Math.floor(Date.now() / 1000) - CHART_RANGE_SECONDS[range];
}

export function filterCandlesByRange(
  candles: CandlePoint[],
  range: ChartRangeKey
): CandlePoint[] {
  const cutoff = rangeCutoffSec(range);
  if (cutoff == null) return candles;
  return candles.filter((c) => c.time >= cutoff);
}

export function filterMarkersByRange(
  markers: ChartMarker[],
  range: ChartRangeKey
): ChartMarker[] {
  const cutoff = rangeCutoffSec(range);
  if (cutoff == null) return markers;
  return markers.filter((m) => m.time >= cutoff);
}

export function filterLineByRange(
  points: LinePoint[],
  range: ChartRangeKey
): LinePoint[] {
  const cutoff = rangeCutoffSec(range);
  if (cutoff == null) return points;
  return points.filter((p) => p.time >= cutoff);
}
