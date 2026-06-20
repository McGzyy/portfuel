import type { UserCallRow } from "@/lib/calls/call-fields";
import type { MemberOpenBookSummary } from "@/lib/calls/member-book";
import { computeMaxDrawdown } from "@/lib/charts/cumulative-return";
import type { LinePoint } from "@/lib/charts/types";
import { getCryptoCandlesForSymbol } from "@/lib/market/crypto-candles";
import { getEquityCandles } from "@/lib/market/equity-candles";
import type { FinnhubCandle } from "@/lib/market/finnhub";
import { localDayStartUnix } from "@/lib/time/timestamp";

export type BookBenchmarkSymbol = "SPY" | "BTC";

export type BookExposureBreakdown = {
  openCount: number;
  equityCount: number;
  cryptoCount: number;
  longCount: number;
  shortCount: number;
  equityPct: number;
  cryptoPct: number;
  longPct: number;
  shortPct: number;
  topSymbols: { symbol: string; count: number; weightPct: number }[];
};

export type BookAnalyticsSnapshot = {
  performancePoints: LinePoint[];
  drawdownPoints: LinePoint[];
  maxDrawdownPct: number | null;
  benchmarkSymbol: BookBenchmarkSymbol;
  benchmarkPoints: LinePoint[];
  portfolioReturnPct: number | null;
  benchmarkReturnPct: number | null;
  relativeReturnPct: number | null;
  exposure: BookExposureBreakdown | null;
};

function candleCloseByDay(candles: FinnhubCandle | null): Map<number, number> {
  const map = new Map<number, number>();
  if (!candles?.t?.length || !candles.c?.length) return map;
  for (let i = 0; i < candles.t.length; i++) {
    const t = candles.t[i];
    const close = candles.c[i];
    if (t == null || close == null) continue;
    map.set(localDayStartUnix(new Date(t * 1000).toISOString()), close);
  }
  return map;
}

function priceOnOrAfter(day: number, prices: Map<number, number>): number | null {
  if (prices.has(day)) return prices.get(day)!;
  for (let d = day; d <= day + 7 * 86_400; d += 86_400) {
    if (prices.has(d)) return prices.get(d)!;
  }
  return null;
}

/** Pick SPY for equity-heavy books, BTC for crypto-heavy open exposure. */
export function pickBookBenchmark(
  calls: Pick<UserCallRow, "asset_class">[]
): BookBenchmarkSymbol {
  let equity = 0;
  let crypto = 0;
  for (const c of calls) {
    if ((c.asset_class ?? "equity") === "crypto") crypto += 1;
    else equity += 1;
  }
  return crypto > equity ? "BTC" : "SPY";
}

export function exposureFromBookSummary(
  summary: MemberOpenBookSummary | null
): BookExposureBreakdown | null {
  if (!summary || summary.openCount === 0) return null;
  const total = summary.openCount;
  return {
    openCount: total,
    equityCount: summary.equityCount,
    cryptoCount: summary.cryptoCount,
    longCount: summary.longCount,
    shortCount: summary.shortCount,
    equityPct: Math.round((summary.equityCount / total) * 100),
    cryptoPct: Math.round((summary.cryptoCount / total) * 100),
    longPct: Math.round((summary.longCount / total) * 100),
    shortPct: Math.round((summary.shortCount / total) * 100),
    topSymbols: summary.bySymbol.slice(0, 6).map((row) => ({
      symbol: row.symbol,
      count: row.count,
      weightPct: Math.round((row.count / total) * 100),
    })),
  };
}

/** Underwater curve — negative values = depth below cumulative peak (% pts). */
export function buildDrawdownSeries(points: LinePoint[]): LinePoint[] {
  if (points.length === 0) return [];
  let peak = points[0]!.value;
  return points.map((p) => {
    peak = Math.max(peak, p.value);
    const depth = peak - p.value;
    return {
      time: p.time,
      value: depth > 0 ? -Math.round(depth * 100) / 100 : 0,
    };
  });
}

/** Buy-and-hold benchmark return aligned to portfolio chart timestamps. */
export async function buildAlignedBenchmarkSeries(
  anchorPoints: LinePoint[],
  symbol: BookBenchmarkSymbol
): Promise<LinePoint[]> {
  if (anchorPoints.length < 2) return [];

  const firstTime = anchorPoints[0]!.time;
  const lastTime = anchorPoints[anchorPoints.length - 1]!.time;
  const from = firstTime - 3 * 86_400;
  const to = lastTime + 86_400;

  const candles =
    symbol === "BTC"
      ? await getCryptoCandlesForSymbol("BTC", from, to, "D")
      : await getEquityCandles("SPY", from, to, "D");

  const prices = candleCloseByDay(candles);
  const startPrice = priceOnOrAfter(firstTime, prices);
  if (startPrice == null || startPrice <= 0) return [];

  const out: LinePoint[] = [];
  for (const p of anchorPoints) {
    const price = priceOnOrAfter(p.time, prices);
    if (price == null) continue;
    const ret = ((price / startPrice) - 1) * 100;
    out.push({ time: p.time, value: Math.round(ret * 100) / 100 });
  }
  return out;
}

export function emptyBookAnalyticsSnapshot(
  performancePoints: LinePoint[] = []
): BookAnalyticsSnapshot {
  return {
    performancePoints,
    drawdownPoints: buildDrawdownSeries(performancePoints),
    maxDrawdownPct: computeMaxDrawdown(performancePoints)?.pct ?? null,
    benchmarkSymbol: "SPY",
    benchmarkPoints: [],
    portfolioReturnPct:
      performancePoints.length > 0
        ? performancePoints[performancePoints.length - 1]!.value
        : null,
    benchmarkReturnPct: null,
    relativeReturnPct: null,
    exposure: null,
  };
}

export async function buildBookAnalyticsSnapshot(opts: {
  performancePoints: LinePoint[];
  exposureSummary: MemberOpenBookSummary | null;
  benchmarkCalls: Pick<UserCallRow, "asset_class">[];
  includeBenchmark: boolean;
}): Promise<BookAnalyticsSnapshot> {
  const { performancePoints } = opts;
  const drawdownPoints = buildDrawdownSeries(performancePoints);
  const maxDd = computeMaxDrawdown(performancePoints);

  const benchmarkSymbol = pickBookBenchmark(opts.benchmarkCalls);
  let benchmarkPoints: LinePoint[] = [];
  if (opts.includeBenchmark && performancePoints.length >= 2) {
    try {
      benchmarkPoints = await buildAlignedBenchmarkSeries(performancePoints, benchmarkSymbol);
    } catch (e) {
      console.error("[book-analytics/benchmark]", e);
    }
  }

  const portfolioReturnPct =
    performancePoints.length > 0
      ? performancePoints[performancePoints.length - 1]!.value
      : null;
  const benchmarkReturnPct =
    benchmarkPoints.length > 0 ? benchmarkPoints[benchmarkPoints.length - 1]!.value : null;
  const relativeReturnPct =
    portfolioReturnPct != null && benchmarkReturnPct != null
      ? Math.round((portfolioReturnPct - benchmarkReturnPct) * 100) / 100
      : null;

  return {
    performancePoints,
    drawdownPoints,
    maxDrawdownPct: maxDd?.pct ?? null,
    benchmarkSymbol,
    benchmarkPoints,
    portfolioReturnPct,
    benchmarkReturnPct,
    relativeReturnPct,
    exposure: exposureFromBookSummary(opts.exposureSummary),
  };
}
