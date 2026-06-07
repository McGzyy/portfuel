import { isDemoMode } from "@/lib/demo/config";
import { fetchEarningsForSymbols } from "@/lib/market/earnings-calendar";
import { getCompanyNews } from "@/lib/market/finnhub";
import type { WatchlistEntry } from "@/lib/watchlist/types";

export type WatchlistIntelSnippet = {
  next_earnings_date: string | null;
  next_earnings_hour: string | null;
  news_headline_count_7d: number;
};

function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchNewsHeadlineCounts(
  symbols: string[],
  days: number
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (symbols.length === 0) return map;

  if (isDemoMode()) {
    const demoCounts: Record<string, number> = {
      NVDA: 14,
      AMD: 6,
      SPY: 9,
    };
    for (const sym of symbols) {
      map.set(sym, demoCounts[sym] ?? 3);
    }
    return map;
  }

  const to = formatIsoDate(new Date());
  const from = formatIsoDate(new Date(Date.now() - days * 86400000));

  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const news = await getCompanyNews(sym, from, to);
        map.set(sym, news.length);
      } catch {
        map.set(sym, 0);
      }
    })
  );

  return map;
}

export async function enrichWatchlistIntelSnippets(
  entries: WatchlistEntry[]
): Promise<WatchlistEntry[]> {
  const equitySymbols = [
    ...new Set(
      entries.filter((e) => e.asset_class === "equity").map((e) => e.symbol.toUpperCase())
    ),
  ];

  if (equitySymbols.length === 0) return entries;

  const [earnings, newsCounts] = await Promise.all([
    fetchEarningsForSymbols(equitySymbols, 14),
    fetchNewsHeadlineCounts(equitySymbols, 7),
  ]);

  const nextEarnings = new Map<string, { date: string; hour: string }>();
  for (const row of earnings) {
    if (!nextEarnings.has(row.symbol)) {
      nextEarnings.set(row.symbol, { date: row.date, hour: row.hour });
    }
  }

  return entries.map((entry) => {
    if (entry.asset_class !== "equity") return entry;

    const ev = nextEarnings.get(entry.symbol);
    return {
      ...entry,
      intel_snippet: {
        next_earnings_date: ev?.date ?? null,
        next_earnings_hour: ev?.hour ?? null,
        news_headline_count_7d: newsCounts.get(entry.symbol) ?? 0,
      } satisfies WatchlistIntelSnippet,
    };
  });
}
