import { getCompanyProfile, getQuote, type FinnhubQuote } from "@/lib/market/finnhub";
import { validateSymbol } from "@/lib/market/validate-symbol";
import type { DiscoveryReason } from "@/lib/desk-discovery/types";

/** Reject stale/bad Finnhub ticks — e.g. current 10× previous close. */
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

export async function loadDiscoveryMarketContext(
  symbol: string,
  assetClass: "equity" | "crypto"
): Promise<{
  companyName: string;
  lastPrice?: number;
  changePct?: number;
  industry?: string;
}> {
  const validated = await validateSymbol(symbol, assetClass);
  if (!validated.ok) {
    return { companyName: symbol.toUpperCase() };
  }

  if (assetClass === "crypto") {
    return {
      companyName: validated.name ?? validated.symbol,
      lastPrice: validated.lastPrice,
    };
  }

  const [quote, profile] = await Promise.all([
    getQuote(validated.symbol, { fresh: true }),
    getCompanyProfile(validated.symbol),
  ]);

  const lastPrice = resolveQuotePrice(quote) ?? validated.lastPrice;

  return {
    companyName: profile?.name?.trim() || validated.name || validated.symbol,
    lastPrice,
    changePct: quote?.dp,
    industry: profile?.finnhubIndustry,
  };
}

export function buildDiscoverySignalBlock(reasons: DiscoveryReason[]): string {
  const lines = reasons.map((r) => `- ${r.type.replace(/_/g, " ")}: ${r.detail}`);
  return `Discovery radar flagged ${reasons.length} signal(s):\n${lines.join("\n")}`;
}

export function buildDiscoveryAdminNote(reasons: DiscoveryReason[]): string {
  const types = [...new Set(reasons.map((r) => r.type.replace(/_/g, " ")))].join(", ");
  return `Desk discovery scan — ${types}. Draft an accountable Fueled call members can act on.`;
}
