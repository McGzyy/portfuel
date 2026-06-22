import { getFilings } from "@/lib/market/finnhub";
import { isDemoMode } from "@/lib/demo/config";
import { recentFilingWeight } from "@/lib/desk-discovery/signal-intensity";
import type { RawDiscoveryHit } from "@/lib/desk-discovery/types";

/** Recent SEC filings (8-K, 10-Q, etc.) for batch symbols. */
export async function scanRecentFilings(symbols: string[]): Promise<RawDiscoveryHit[]> {
  if (isDemoMode() || symbols.length === 0) return [];

  const hits: RawDiscoveryHit[] = [];
  const now = Date.now();
  const chunkSize = 5;

  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const chunkHits = await Promise.all(
      chunk.map(async (symbol): Promise<RawDiscoveryHit | null> => {
        const sym = symbol.toUpperCase();
        try {
          const filings = await getFilings(sym);
          const recent = filings
            .map((f) => {
              const filed = Date.parse(f.filedDate);
              const daysAgo = Number.isFinite(filed)
                ? Math.round((now - filed) / 86400000)
                : 99;
              return { ...f, daysAgo };
            })
            .filter((f) => f.daysAgo <= 5)
            .sort((a, b) => a.daysAgo - b.daysAgo)[0];

          if (!recent) return null;
          const weight = recentFilingWeight(recent.form, recent.daysAgo);
          if (weight <= 0) return null;

          return {
            symbol: sym,
            assetClass: "equity" as const,
            type: "recent_filing" as const,
            detail: `${recent.form} filed ${recent.daysAgo === 0 ? "today" : `${recent.daysAgo}d ago`}`,
            weight,
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
