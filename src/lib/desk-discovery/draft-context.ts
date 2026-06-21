import { getCompanyProfile, getQuote } from "@/lib/market/finnhub";
import { fetchEarningsCalendarRange } from "@/lib/market/earnings-calendar";
import { resolveEquityLastPrice, resolveQuotePrice } from "@/lib/market/equity-quote";
import { validateSymbol } from "@/lib/market/validate-symbol";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import type { DiscoveryReason } from "@/lib/desk-discovery/types";

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

  const lastPrice =
    (await resolveEquityLastPrice(validated.symbol)) ??
    resolveQuotePrice(quote) ??
    validated.lastPrice;

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

/** Upcoming earnings EPS/date for discovery AI prompt when earnings_soon is flagged. */
export async function buildDiscoveryEarningsContext(
  symbol: string,
  reasons: DiscoveryReason[]
): Promise<string | null> {
  if (!reasons.some((r) => r.type === "earnings_soon")) return null;

  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + DISCOVERY_CONFIG.earningsMaxDays);

  try {
    const rows = await fetchEarningsCalendarRange(from, to);
    const sym = symbol.toUpperCase();
    const hit = rows.find((r) => r.symbol === sym);
    if (!hit) return null;

    const hour = hit.hour ? ` ${hit.hour.toUpperCase()}` : "";
    const eps =
      hit.epsEstimate != null ? ` · EPS est $${hit.epsEstimate.toFixed(2)}` : "";
    return `Upcoming earnings ${hit.date}${hour}${eps} (Q${hit.quarter} ${hit.year}).`;
  } catch {
    return null;
  }
}
