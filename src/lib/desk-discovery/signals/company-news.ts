import { getCompanyNews } from "@/lib/market/finnhub";
import { isDemoMode } from "@/lib/demo/config";
import { NEWS_CATALYST_KEYWORDS } from "@/lib/desk-discovery/config";
import { newsCatalystWeight } from "@/lib/desk-discovery/signal-intensity";
import type { RawDiscoveryHit } from "@/lib/desk-discovery/types";

function catalystStrength(text: string): number {
  const lower = text.toLowerCase();
  return NEWS_CATALYST_KEYWORDS.filter((kw) => lower.includes(kw)).length;
}

/** Company-specific headlines for symbols in the rotating equity batch. */
export async function scanCompanyNews(symbols: string[]): Promise<RawDiscoveryHit[]> {
  if (isDemoMode() || symbols.length === 0) return [];

  const nowSec = Math.floor(Date.now() / 1000);
  const fromDate = new Date((nowSec - 7 * 86400) * 1000).toISOString().slice(0, 10);
  const toDate = new Date(nowSec * 1000).toISOString().slice(0, 10);
  const hits: RawDiscoveryHit[] = [];
  const chunkSize = 4;

  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const chunkHits = await Promise.all(
      chunk.map(async (symbol): Promise<RawDiscoveryHit | null> => {
        const sym = symbol.toUpperCase();
        try {
          const rows = await getCompanyNews(sym, fromDate, toDate);
          const sorted = [...rows].sort((a, b) => b.datetime - a.datetime);
          const item = sorted.find((row) => catalystStrength(`${row.headline} ${row.summary ?? ""}`) > 0);
          if (!item) return null;

          const hoursAgo = (nowSec - item.datetime) / 3600;
          const keywordHits = catalystStrength(`${item.headline} ${item.summary ?? ""}`);
          return {
            symbol: sym,
            assetClass: "equity" as const,
            type: "news_catalyst" as const,
            detail: `[${sym}] ${item.headline.slice(0, 140)}`,
            weight: newsCatalystWeight({
              hoursAgo,
              keywordHits,
              isCompanySpecific: true,
            }),
          };
        } catch {
          return null;
        }
      })
    );
    hits.push(...chunkHits.filter(Boolean) as RawDiscoveryHit[]);
  }

  return hits;
}
