import type { CandlePoint, LinePoint, PriceLine } from "@/lib/charts/types";

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

/** Map absolute price levels onto the same % scale as `candlesToNormalizedLine`. */
export function normalizePriceLines(lines: PriceLine[], baseClose: number): PriceLine[] {
  if (!baseClose) return [];
  return lines.map((line) => ({
    ...line,
    price: ((line.price - baseClose) / baseClose) * 100,
  }));
}
