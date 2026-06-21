import { getEquityCandles } from "@/lib/market/equity-candles";
import { getQuote, type FinnhubQuote } from "@/lib/market/finnhub";

/** Reject stale/bad Finnhub ticks — e.g. current far from previous close. */
export function resolveQuotePrice(quote: FinnhubQuote | null | undefined): number | undefined {
  if (!quote?.c || !Number.isFinite(quote.c) || quote.c <= 0) return undefined;
  const current = quote.c;
  const prev = quote.pc;
  if (prev != null && prev > 0) {
    const ratio = current / prev;
    if (ratio > 2.5 || ratio < 0.4) return prev;
  }
  return current;
}

export function pickBestEquityPrice(
  quotePrice: number | undefined,
  dailyClose: number | undefined
): number | undefined {
  if (quotePrice == null && dailyClose == null) return undefined;
  if (quotePrice == null) return dailyClose;
  if (dailyClose == null || dailyClose <= 0) return quotePrice;

  const ratio = quotePrice / dailyClose;
  if (ratio > 1.35 || ratio < 0.65) return dailyClose;
  return quotePrice;
}

/** Best-effort equity last price — quote vs recent daily close. */
export async function resolveEquityLastPrice(symbol: string): Promise<number | undefined> {
  const quote = await getQuote(symbol, { fresh: true });
  const quotePrice = resolveQuotePrice(quote);

  const to = Math.floor(Date.now() / 1000);
  const from = to - 7 * 86400;
  let dailyClose: number | undefined;
  try {
    const candles = await getEquityCandles(symbol, from, to, "D");
    const closes = candles?.c;
    if (closes?.length) {
      dailyClose = closes[closes.length - 1]!;
    }
  } catch {
    /* optional fallback */
  }

  return pickBestEquityPrice(quotePrice, dailyClose);
}
