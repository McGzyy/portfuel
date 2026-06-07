import type { ChartCandleResolution } from "@/lib/charts/types";
import type { FinnhubCandle } from "@/lib/market/finnhub";
import { getCoreCryptoAsset, resolveCryptoAsset } from "@/lib/market/crypto-allowlist";
import { getCryptoCandles } from "@/lib/market/finnhub";
import { getTwelveDataCandles, isTwelveDataConfigured } from "@/lib/market/twelvedata";

function twelveDataPair(base: string): string {
  return `${base.toUpperCase()}/USD`;
}

/** Crypto OHLCV — Finnhub when available, else Twelve Data (SOL/USD, BTC/USD, etc.). */
export async function getCryptoCandlesForSymbol(
  symbol: string,
  from: number,
  to: number,
  resolution: ChartCandleResolution = "D"
): Promise<FinnhubCandle | null> {
  const base = symbol.toUpperCase().trim();
  if (!base) return null;

  const core = getCoreCryptoAsset(base);
  const finnhubSymbol =
    core?.finnhub_symbol ??
    (await resolveCryptoAsset(base))?.finnhub_symbol ??
    null;

  if (finnhubSymbol) {
    const finnhub = await getCryptoCandles(finnhubSymbol, from, to, resolution);
    if (finnhub?.s === "ok" && finnhub.t?.length) return finnhub;
  }

  if (!isTwelveDataConfigured()) return null;

  const twelve = await getTwelveDataCandles(twelveDataPair(base), from, to, resolution);
  if (twelve) {
    console.info("[crypto-candles] Twelve Data fallback", base, resolution);
  }
  return twelve;
}

export async function getCryptoLastPriceForSymbol(symbol: string): Promise<number | null> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 7 * 86400;
  const candles = await getCryptoCandlesForSymbol(symbol, from, to, "D");
  if (!candles?.c?.length) return null;
  const last = candles.c[candles.c.length - 1];
  return last != null && Number.isFinite(last) && last > 0 ? last : null;
}
