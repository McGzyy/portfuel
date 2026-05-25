import type { CandlePoint, LinePoint } from "@/lib/charts/types";

/** Normalize daily closes to % change from first bar (for side-by-side compare). */
export function candlesToNormalizedLine(candles: CandlePoint[]): LinePoint[] {
  if (candles.length === 0) return [];
  const base = candles[0].close;
  if (!base) return [];
  return candles.map((c) => ({
    time: c.time,
    value: ((c.close - base) / base) * 100,
  }));
}
