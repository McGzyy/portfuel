import { getCryptoCandlesForSymbol } from "@/lib/market/crypto-candles";
import { isDemoMode } from "@/lib/demo/config";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { discoveryCryptoUniverse } from "@/lib/desk-discovery/universe";
import type { RawDiscoveryHit } from "@/lib/desk-discovery/types";

function pctChange(from: number, to: number): number {
  if (!from) return 0;
  return (to - from) / from;
}

export async function scanCryptoMomentum(): Promise<RawDiscoveryHit[]> {
  if (isDemoMode()) {
    return [
      {
        symbol: "SOL",
        assetClass: "crypto",
        type: "crypto_momentum",
        detail: "Demo: SOL +8.2% vs BTC over 7d",
      },
    ];
  }

  const symbols = discoveryCryptoUniverse();
  const now = Math.floor(Date.now() / 1000);
  const from = now - 10 * 86400;

  const btcCandle = await getCryptoCandlesForSymbol("BTC", from, now, "D");
  if (!btcCandle?.c?.length || btcCandle.c.length < 3) return [];

  const btcStart = btcCandle.c[0]!;
  const btcEnd = btcCandle.c[btcCandle.c.length - 1]!;
  const btcReturn = pctChange(btcStart, btcEnd);

  const hits: RawDiscoveryHit[] = [];

  for (const symbol of symbols) {
    if (symbol === "BTC") continue;
    const pair = symbol;
    const candle = await getCryptoCandlesForSymbol(pair, from, now, "D");
    if (!candle?.c?.length || candle.c.length < 3) continue;

    const symReturn = pctChange(candle.c[0]!, candle.c[candle.c.length - 1]!);
    const rel = symReturn - btcReturn;

    if (
      rel < DISCOVERY_CONFIG.cryptoMomentumMin ||
      rel > DISCOVERY_CONFIG.cryptoMomentumMax
    ) {
      continue;
    }

    hits.push({
      symbol,
      assetClass: "crypto",
      type: "crypto_momentum",
      detail: `${symbol} ${(symReturn * 100).toFixed(1)}% 7d vs BTC ${(btcReturn * 100).toFixed(1)}% (rel ${(rel * 100).toFixed(1)}%)`,
    });
  }

  return hits.sort((a, b) => b.detail.localeCompare(a.detail)).slice(0, 8);
}
