import type { CandlePoint } from "@/lib/charts/types";

export type CandleReturnWindows = {
  d7: number | null;
  d30: number | null;
  d90: number | null;
  ytd: number | null;
  high52w: number | null;
  low52w: number | null;
};

function returnPct(from: number, to: number): number | null {
  if (!Number.isFinite(from) || from === 0 || !Number.isFinite(to)) return null;
  return ((to - from) / from) * 100;
}

function closeAtOrBefore(candles: CandlePoint[], targetTime: number): number | null {
  let best: CandlePoint | null = null;
  for (const c of candles) {
    if (c.time <= targetTime && (!best || c.time > best.time)) best = c;
  }
  return best?.close ?? null;
}

/** Period returns and range from daily candles (crypto + equity). */
export function computeCandleReturnWindows(candles: CandlePoint[]): CandleReturnWindows {
  if (candles.length === 0) {
    return {
      d7: null,
      d30: null,
      d90: null,
      ytd: null,
      high52w: null,
      low52w: null,
    };
  }

  const last = candles[candles.length - 1]!;
  const now = last.time;
  const d7 = returnPct(closeAtOrBefore(candles, now - 7 * 86400) ?? NaN, last.close);
  const d30 = returnPct(closeAtOrBefore(candles, now - 30 * 86400) ?? NaN, last.close);
  const d90 = returnPct(closeAtOrBefore(candles, now - 90 * 86400) ?? NaN, last.close);

  const yearStart = new Date(new Date(last.time * 1000).getFullYear(), 0, 1);
  const ytdStart = Math.floor(yearStart.getTime() / 1000);
  const ytd = returnPct(closeAtOrBefore(candles, ytdStart) ?? NaN, last.close);

  let high52w = last.high;
  let low52w = last.low;
  for (const c of candles) {
    if (c.high > high52w) high52w = c.high;
    if (c.low < low52w) low52w = c.low;
  }

  return { d7, d30, d90, ytd, high52w, low52w };
}
