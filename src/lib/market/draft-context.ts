import { resolveCryptoAsset } from "@/lib/market/crypto-allowlist";
import { getCompanyProfile, getCryptoLastPrice, getQuote } from "@/lib/market/finnhub";

/** Lightweight quote context for journal AI draft — avoids full ticker intel load. */
export async function fetchJournalDraftMarketContext(
  symbol: string,
  assetClass: "equity" | "crypto",
  journalPrice?: number | null
): Promise<{
  companyName: string;
  lastPrice: number | null;
  changePct: number | null;
  industry?: string | null;
  marketCapBn?: number | null;
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
    const [quote, profile] = await Promise.all([getQuote(sym), getCompanyProfile(sym)]);
    const marketCapBn =
      profile?.marketCapitalization != null && profile.marketCapitalization > 0
        ? Math.round(profile.marketCapitalization * 10) / 10
        : null;
    return {
      companyName: profile?.name?.trim() || sym,
      lastPrice: quote?.c ?? journalPrice ?? null,
      changePct: quote?.dp ?? null,
      industry: profile?.finnhubIndustry ?? null,
      marketCapBn,
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
