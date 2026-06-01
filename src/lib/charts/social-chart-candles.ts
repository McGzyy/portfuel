import type { CandlePoint } from "@/lib/charts/types";

const MAX_BARS = 42;

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function toCandle(time: number, open: number, close: number, entryPrice: number, rand: () => number): CandlePoint {
  const body = Math.abs(close - open);
  const wickExtra = entryPrice * (0.002 + rand() * 0.006);
  let high = Math.max(open, close) + Math.max(wickExtra, body * 0.55);
  let low = Math.min(open, close) - Math.max(wickExtra, body * 0.55);
  const maxBarRange = entryPrice * 0.035;
  const mid = (open + close) / 2;
  high = Math.min(high, mid + maxBarRange);
  low = Math.max(low, mid - maxBarRange);
  return { time, open, high, low, close };
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
  const rand = seededRand(Math.round(entryPrice * 100 + currentPrice * 10 + bars));

  let close = entryPrice * (0.92 + rand() * 0.05);
  let noise = 0;

  for (let i = 0; i < bars; i++) {
    const t = now - (bars - 1 - i) * 86400;
    const open = close;

    if (i < callBarIndex) {
      const pullToEntry = (entryPrice - close) * (0.12 + rand() * 0.08);
      const shock = (rand() - 0.5) * entryPrice * 0.024;
      close = open + pullToEntry + shock;
    } else if (i === callBarIndex) {
      close = entryPrice;
    } else {
      const postIdx = i - callBarIndex;
      const postTotal = Math.max(bars - callBarIndex - 1, 1);
      const progress = postIdx / postTotal;
      const bridge = entryPrice + (currentPrice - entryPrice) * progress;
      // Build a realistic path: trend-to-target + noisy, mean-reverting pullbacks.
      const vol = entryPrice * (0.014 + rand() * 0.022);
      const step = (rand() - 0.5) * vol * 2.15;
      const meanRevert = -noise * (0.18 + rand() * 0.12);
      noise = noise + step + meanRevert;

      // Occasional sharper red days (pullbacks).
      if (postIdx > 1 && postIdx < postTotal - 2 && rand() < 0.32) {
        noise -= entryPrice * (0.006 + rand() * 0.02);
      }
      // Occasional pop days.
      if (postIdx > 2 && postIdx < postTotal - 2 && rand() < 0.16) {
        noise += entryPrice * (0.005 + rand() * 0.014);
      }

      close = bridge + noise;
      const maxDev = entryPrice * (0.06 + progress * 0.03);
      close = Math.max(bridge - maxDev, Math.min(bridge + maxDev, close));

      if (postIdx === postTotal) {
        close = currentPrice;
      } else if (postIdx >= postTotal - 2) {
        const blend = postIdx === postTotal - 1 ? 0.55 : 0.85;
        close = close + (currentPrice - close) * blend;
        noise = close - bridge;
      }
    }

    candles.push(toCandle(t, open, close, entryPrice, rand));
  }

  return candles;
}
