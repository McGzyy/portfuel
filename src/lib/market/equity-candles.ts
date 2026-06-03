import type { ChartCandleResolution } from "@/lib/charts/types";
import type { FinnhubCandle } from "@/lib/market/finnhub";
import {
  getDailyCandles,
  getIntradayCandles,
} from "@/lib/market/finnhub";
import { getTwelveDataCandles, isTwelveDataConfigured } from "@/lib/market/twelvedata";

function finnhubResolution(resolution: ChartCandleResolution): "D" | "60" | "15" {
  return resolution === "D" ? "D" : resolution;
}

/** Equity OHLCV — Finnhub when paid access works, else Twelve Data (free tier). */
export async function getEquityCandles(
  symbol: string,
  from: number,
  to: number,
  resolution: ChartCandleResolution = "D"
): Promise<FinnhubCandle | null> {
  const finnhub =
    resolution === "D"
      ? await getDailyCandles(symbol, from, to)
      : await getIntradayCandles(symbol, finnhubResolution(resolution), from, to);

  if (finnhub?.s === "ok" && finnhub.t?.length) return finnhub;

  if (!isTwelveDataConfigured()) return null;

  const twelve = await getTwelveDataCandles(symbol, from, to, resolution);
  if (twelve) {
    console.info("[equity-candles] Twelve Data fallback", symbol, resolution);
  }
  return twelve;
}

/** @deprecated Use getEquityCandles — kept for imports migrating from finnhub-only. */
export async function getEquityDailyCandles(
  symbol: string,
  from: number,
  to: number
): Promise<FinnhubCandle | null> {
  return getEquityCandles(symbol, from, to, "D");
}

export function equityCandlesConfigured(): boolean {
  return isTwelveDataConfigured() || Boolean(process.env.FINNHUB_API_KEY?.trim());
}
