import { getEquityCandles } from "@/lib/market/equity-candles";
import { closesToSparklinePoints } from "@/lib/charts/sparkline";
import type { LinePoint } from "@/lib/charts/types";

const SPARKLINE_DAYS = 30;

export async function fetchSymbolSparkline(symbol: string): Promise<LinePoint[]> {
  const sym = symbol.toUpperCase();
  const to = Math.floor(Date.now() / 1000);
  const from = to - SPARKLINE_DAYS * 86400;

  const candles = await getEquityCandles(sym, from, to, "D");
  if (!candles?.t?.length || !candles.c?.length) return [];

  return closesToSparklinePoints(candles.t, candles.c);
}

export async function fetchSparklinesForSymbols(
  symbols: string[]
): Promise<Record<string, LinePoint[]>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))].slice(0, 12);
  const entries = await Promise.all(
    unique.map(async (symbol) => {
      try {
        const points = await fetchSymbolSparkline(symbol);
        return [symbol, points] as const;
      } catch {
        return [symbol, []] as const;
      }
    })
  );
  return Object.fromEntries(entries);
}
