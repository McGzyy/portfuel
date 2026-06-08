import { resolveCryptoAsset } from "@/lib/market/crypto-allowlist";
import { getCryptoLastPrice, getQuote } from "@/lib/market/finnhub";

/** Lightweight quote context for journal AI draft — avoids full ticker intel load. */
export async function fetchJournalDraftMarketContext(
  symbol: string,
  assetClass: "equity" | "crypto",
  journalPrice?: number | null
): Promise<{
  companyName: string;
  lastPrice: number | null;
  changePct: number | null;
}> {
  const sym = symbol.toUpperCase();

  if (assetClass === "crypto") {
    const crypto = await resolveCryptoAsset(sym);
    let lastPrice = journalPrice ?? null;
    if (lastPrice == null && crypto?.finnhub_symbol) {
      try {
        lastPrice = await getCryptoLastPrice(crypto.finnhub_symbol);
      } catch (e) {
        console.error("[draft-context crypto price]", sym, e);
      }
    }
    return {
      companyName: crypto?.display_name ?? sym,
      lastPrice,
      changePct: null,
    };
  }

  try {
    const quote = await getQuote(sym);
    return {
      companyName: sym,
      lastPrice: quote?.c ?? journalPrice ?? null,
      changePct: quote?.dp ?? null,
    };
  } catch (e) {
    console.error("[draft-context equity quote]", sym, e);
    return {
      companyName: sym,
      lastPrice: journalPrice ?? null,
      changePct: null,
    };
  }
}
