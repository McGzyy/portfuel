import { getMarketNews } from "@/lib/market/finnhub";
import { parseRelatedSymbols } from "@/lib/market/market-headlines";
import { isDemoMode } from "@/lib/demo/config";
import { DISCOVERY_CONFIG, NEWS_CATALYST_KEYWORDS } from "@/lib/desk-discovery/config";
import { newsCatalystWeight } from "@/lib/desk-discovery/signal-intensity";
import { DISCOVERY_EQUITY_UNIVERSE } from "@/lib/desk-discovery/universe";
import type { RawDiscoveryHit } from "@/lib/desk-discovery/types";

function headlineHasCatalyst(text: string): { ok: boolean; keywordHits: number } {
  const lower = text.toLowerCase();
  let keywordHits = 0;
  for (const kw of NEWS_CATALYST_KEYWORDS) {
    if (lower.includes(kw)) keywordHits += 1;
  }
  return { ok: keywordHits > 0, keywordHits };
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
        weight: 28,
      },
    ];
  }

  const [general, merger] = await Promise.all([
    getMarketNews("general"),
    getMarketNews("merger"),
  ]);

  const nowSec = Math.floor(Date.now() / 1000);
  const items = [...general, ...merger].sort((a, b) => b.datetime - a.datetime);

  for (const item of items) {
    const text = `${item.headline} ${item.summary ?? ""}`;
    const catalyst = headlineHasCatalyst(text);
    if (!catalyst.ok) continue;

    const hoursAgo = (nowSec - item.datetime) / 3600;

    for (const sym of parseRelatedSymbols(item.related)) {
      if (!universe.has(sym) || seen.has(sym)) continue;
      seen.add(sym);
      hits.push({
        symbol: sym,
        assetClass: "equity",
        type: "news_catalyst",
        detail: item.headline.slice(0, 160),
        weight: newsCatalystWeight({
          hoursAgo,
          keywordHits: catalyst.keywordHits,
          isCompanySpecific: false,
        }),
      });
      if (hits.length >= DISCOVERY_CONFIG.maxCandidatesPerScan) break;
    }
    if (hits.length >= DISCOVERY_CONFIG.maxCandidatesPerScan) break;
  }

  return hits;
}
