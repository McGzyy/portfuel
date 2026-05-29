import type { CandlePoint } from "@/lib/charts/types";

const MAX_BARS = 62;

/** Sort, dedupe by day, trim to a contiguous window for social charts. */
export function prepareSocialChartCandles(
  raw: CandlePoint[],
  callTimestampSec: number
): CandlePoint[] {
  if (raw.length === 0) return [];

  const byDay = new Map<number, CandlePoint>();
  for (const c of raw) {
    const day = Math.floor(c.time / 86400) * 86400;
    if (!Number.isFinite(c.open) || !Number.isFinite(c.close)) continue;
    byDay.set(day, {
      time: day,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    });
  }

  const sorted = [...byDay.values()].sort((a, b) => a.time - b.time);
  if (sorted.length === 0) return [];

  const from = callTimestampSec - 50 * 86400;
  let windowed = sorted.filter((c) => c.time >= from);

  if (windowed.length < 20) {
    windowed = sorted.slice(-MAX_BARS);
  } else if (windowed.length > MAX_BARS) {
    windowed = windowed.slice(-MAX_BARS);
  }

  return windowed;
}

export function buildSyntheticSocialCandles(opts: {
  bars: number;
  entryPrice: number;
  currentPrice: number;
  callBarIndex: number;
}): CandlePoint[] {
  const candles: CandlePoint[] = [];
  const now = Math.floor(Date.now() / 86400) * 86400;
  const { bars, entryPrice, currentPrice, callBarIndex } = opts;

  for (let i = 0; i < bars; i++) {
    const t = now - (bars - 1 - i) * 86400;
    const phase = i / Math.max(bars - 1, 1);
    const preCall = i <= callBarIndex;
    const progress = preCall
      ? (i / Math.max(callBarIndex, 1)) * 0.35
      : 0.35 + ((i - callBarIndex) / Math.max(bars - callBarIndex - 1, 1)) * 0.65;
    const base = entryPrice + (currentPrice - entryPrice) * progress;
    const wave = Math.sin(i * 0.55) * entryPrice * 0.009 + Math.cos(i * 0.21) * entryPrice * 0.004;
    const open = base + wave * 0.35;
    const close = base + wave;
    const high = Math.max(open, close) + entryPrice * 0.006;
    const low = Math.min(open, close) - entryPrice * 0.006;

    candles.push({ time: t, open, high, low, close });
  }

  return candles;
}
