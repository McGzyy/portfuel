import { getMarketNews } from "@/lib/market/finnhub";
import { parseRelatedSymbols } from "@/lib/market/market-headlines";
import { isDemoMode } from "@/lib/demo/config";
import { DISCOVERY_CONFIG, NEWS_CATALYST_KEYWORDS } from "@/lib/desk-discovery/config";
import { DISCOVERY_EQUITY_UNIVERSE } from "@/lib/desk-discovery/universe";
import type { RawDiscoveryHit } from "@/lib/desk-discovery/types";

function headlineHasCatalyst(text: string): boolean {
  const lower = text.toLowerCase();
  return NEWS_CATALYST_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function scanNewsCatalysts(): Promise<RawDiscoveryHit[]> {
  const universe = new Set(DISCOVERY_EQUITY_UNIVERSE.map((s) => s.toUpperCase()));
  const hits: RawDiscoveryHit[] = [];
  const seen = new Set<string>();

  if (isDemoMode()) {
    return [
      {
        symbol: "NVDA",
        assetClass: "equity",
        type: "news_catalyst",
        detail: "Demo: datacenter demand headline tags NVDA",
      },
    ];
  }

  const [general, merger] = await Promise.all([
    getMarketNews("general"),
    getMarketNews("merger"),
  ]);

  const items = [...general, ...merger].sort((a, b) => b.datetime - a.datetime);

  for (const item of items) {
    const text = `${item.headline} ${item.summary ?? ""}`;
    if (!headlineHasCatalyst(text)) continue;

    for (const sym of parseRelatedSymbols(item.related)) {
      if (!universe.has(sym) || seen.has(sym)) continue;
      seen.add(sym);
      hits.push({
        symbol: sym,
        assetClass: "equity",
        type: "news_catalyst",
        detail: item.headline.slice(0, 160),
      });
      if (hits.length >= DISCOVERY_CONFIG.maxCandidatesPerScan) break;
    }
    if (hits.length >= DISCOVERY_CONFIG.maxCandidatesPerScan) break;
  }

  return hits;
}
