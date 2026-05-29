import type { CandlePoint } from "@/lib/charts/types";

const MAX_BARS = 28;

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

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
  const { bars, entryPrice, currentPrice, callBarIndex } = opts;
  const candles: CandlePoint[] = [];
  const now = Math.floor(Date.now() / 86400) * 86400;
  const rand = seededRand(Math.round(entryPrice * 100 + currentPrice * 10));

  const startPrice = entryPrice * (0.94 + rand() * 0.04);
  let close = startPrice;

  for (let i = 0; i < bars; i++) {
    const t = now - (bars - 1 - i) * 86400;
    const postCall = i > callBarIndex;
    const postProgress = postCall
      ? (i - callBarIndex) / Math.max(bars - callBarIndex - 1, 1)
      : 0;

    const target =
      i <= callBarIndex
        ? entryPrice * (0.97 + (i / Math.max(callBarIndex, 1)) * 0.03)
        : entryPrice + (currentPrice - entryPrice) * Math.pow(postProgress, 1.05);

    const drift = (target - close) * (postCall ? 0.28 : 0.2);
    const shock = (rand() - 0.48) * entryPrice * (postCall ? 0.012 : 0.01);
    const open = close;
    close = open + drift + shock;

    if (i === callBarIndex) {
      close = entryPrice;
    }
    if (i >= bars - 3) {
      const step = i - (bars - 3);
      const blend = step === 0 ? 0.35 : step === 1 ? 0.62 : 1;
      close = open + (currentPrice - open) * blend;
    }

    const body = Math.abs(close - open);
    const wickExtra = entryPrice * (0.003 + rand() * 0.005);
    let high = Math.max(open, close) + Math.max(wickExtra, body * 0.4);
    let low = Math.min(open, close) - Math.max(wickExtra, body * 0.4);
    const maxBarRange = entryPrice * 0.028;
    const mid = (open + close) / 2;
    high = Math.min(high, mid + maxBarRange);
    low = Math.max(low, mid - maxBarRange);

    candles.push({ time: t, open, high, low, close });
  }

  return candles;
}
