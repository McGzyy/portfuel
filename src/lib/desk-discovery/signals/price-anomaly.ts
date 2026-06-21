import { getEquityCandles } from "@/lib/market/equity-candles";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import type { RawDiscoveryHit } from "@/lib/desk-discovery/types";

function pctChange(from: number, to: number): number {
  if (!from) return 0;
  return (to - from) / from;
}

export async function scanPriceAnomalies(symbols: string[]): Promise<RawDiscoveryHit[]> {
  const hits: RawDiscoveryHit[] = [];
  const chunkSize = 5;

  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const chunkHits = await Promise.all(chunk.map((symbol) => scanOnePriceAnomaly(symbol)));
    hits.push(...chunkHits.filter(Boolean) as RawDiscoveryHit[]);
  }

  return hits;
}

async function scanOnePriceAnomaly(symbol: string): Promise<RawDiscoveryHit | null> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 35 * 86400;

  const candle = await getEquityCandles(symbol, from, now, "D");
  if (!candle?.c?.length || candle.c.length < 6) return null;

  const closes = candle.c;
  const volumes = candle.v ?? [];
  const last = closes.length - 1;
  const prev = closes[last - 1]!;
  const latest = closes[last]!;
  const dailyChange = pctChange(prev, latest);

  if (
    dailyChange < DISCOVERY_CONFIG.priceChangeMin ||
    dailyChange > DISCOVERY_CONFIG.priceChangeMax
  ) {
    return null;
  }

  const fiveBack = closes[Math.max(0, last - 5)]!;
  const fiveDayChange = pctChange(fiveBack, latest);
  if (fiveDayChange > DISCOVERY_CONFIG.parabolic5dMax) return null;

  const recentVol = volumes.slice(-21);
  if (recentVol.length >= 21) {
    const todayVol = recentVol[recentVol.length - 1] ?? 0;
    const avgVol =
      recentVol.slice(0, -1).reduce((a, b) => a + b, 0) / (recentVol.length - 1);
    if (avgVol > 0 && todayVol / avgVol >= DISCOVERY_CONFIG.volumeRatioMin) {
      return {
        symbol: symbol.toUpperCase(),
        assetClass: "equity",
        type: "volume_anomaly",
        detail: `Volume ${(todayVol / avgVol).toFixed(1)}× 20d avg with ${(dailyChange * 100).toFixed(1)}% move`,
      };
    }
  }

  return {
    symbol: symbol.toUpperCase(),
    assetClass: "equity",
    type: "price_move",
    detail: `${(dailyChange * 100).toFixed(1)}% daily move`,
  };
}
