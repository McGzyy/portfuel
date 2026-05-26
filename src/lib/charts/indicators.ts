import type { CandlePoint, LinePoint } from "@/lib/charts/types";

export function computeSma(candles: CandlePoint[], period = 20): LinePoint[] {
  if (candles.length < period) return [];

  const out: LinePoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    out.push({
      time: candles[i].time,
      value: Math.round((sum / period) * 100) / 100,
    });
  }
  return out;
}

/** Session VWAP from typical price × volume (requires volume on candles). */
export function computeVwap(candles: CandlePoint[]): LinePoint[] {
  const out: LinePoint[] = [];
  let cumVol = 0;
  let cumTpVol = 0;

  for (const c of candles) {
    const vol = c.volume ?? 0;
    if (vol <= 0) continue;
    const tp = (c.high + c.low + c.close) / 3;
    cumVol += vol;
    cumTpVol += tp * vol;
    out.push({
      time: c.time,
      value: Math.round((cumTpVol / cumVol) * 100) / 100,
    });
  }

  return out;
}

export function hasVolumeData(candles: CandlePoint[]): boolean {
  return candles.some((c) => (c.volume ?? 0) > 0);
}
