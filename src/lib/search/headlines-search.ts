import type { MarketHeadline } from "@/lib/market/market-headlines";
import { fetchMarketHeadlinesByLane } from "@/lib/market/market-headlines";
import type { SearchHeadlineResult } from "@/lib/search/types";

const CACHE_MS = 5 * 60 * 1000;
const HEADLINE_LIMIT = 5;
const MIN_QUERY_LEN = 3;

let headlinePoolCache: {
  watchlistKey: string;
  fetchedAt: number;
  headlines: MarketHeadline[];
} | null = null;

function watchlistKey(symbols: string[]): string {
  return symbols
    .map((s) => s.toUpperCase())
    .sort()
    .join(",");
}

async function loadHeadlinePool(watchlistSymbols: string[]): Promise<MarketHeadline[]> {
  const key = watchlistKey(watchlistSymbols);
  const now = Date.now();
  if (
    headlinePoolCache &&
    headlinePoolCache.watchlistKey === key &&
    now - headlinePoolCache.fetchedAt < CACHE_MS
  ) {
    return headlinePoolCache.headlines;
  }

  const [market, crypto, deals, watchlist] = await Promise.all([
    fetchMarketHeadlinesByLane("market", watchlistSymbols),
    fetchMarketHeadlinesByLane("crypto", watchlistSymbols),
    fetchMarketHeadlinesByLane("deals", watchlistSymbols),
    watchlistSymbols.length > 0
      ? fetchMarketHeadlinesByLane("watchlist", watchlistSymbols)
      : Promise.resolve([]),
  ]);

  const seen = new Set<number>();
  const merged: MarketHeadline[] = [];
  for (const row of [...watchlist, ...market, ...crypto, ...deals].sort(
    (a, b) => b.datetime - a.datetime
  )) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
    if (merged.length >= 120) break;
  }

  headlinePoolCache = { watchlistKey: key, fetchedAt: now, headlines: merged };
  return merged;
}

function scoreHeadline(row: MarketHeadline, q: string, upper: string): number {
  const headline = row.headline.toLowerCase();
  const summary = row.summary.toLowerCase();
  let score = 0;
  if (headline.includes(q)) score += headline.startsWith(q) ? 80 : 60;
  if (summary.includes(q)) score += 30;
  if (row.relatedSymbols.some((s) => s.includes(upper) || upper.includes(s))) score += 50;
  return score;
}

export async function searchMarketHeadlines(
  query: string,
  watchlistSymbols: string[] = []
): Promise<SearchHeadlineResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LEN) return [];

  const upper = query.trim().toUpperCase();
  const pool = await loadHeadlinePool(watchlistSymbols);

  return pool
    .map((row) => ({ row, score: scoreHeadline(row, q, upper) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.row.datetime - a.row.datetime)
    .slice(0, HEADLINE_LIMIT)
    .map(({ row }) => ({
      id: row.id,
      headline: row.headline,
      source: row.source,
      url: row.url,
      datetime: row.datetime,
      relatedSymbols: row.relatedSymbols,
    }));
}
