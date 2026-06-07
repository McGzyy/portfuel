import { isDemoMode } from "@/lib/demo/config";
import {
  getMarketNews,
  type MarketNewsCategory,
  type MarketNewsItem,
} from "@/lib/market/finnhub";

export type MarketHeadlineLane = "market" | "crypto" | "deals" | "watchlist";

export type MarketHeadline = {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  category: MarketNewsCategory;
  relatedSymbols: string[];
  onWatchlist: boolean;
};

export const MARKET_HEADLINE_LANES: {
  id: MarketHeadlineLane;
  label: string;
  description: string;
}[] = [
  {
    id: "market",
    label: "Market",
    description: "Macro, indices, and broad equities",
  },
  {
    id: "crypto",
    label: "Crypto",
    description: "Industry and major-token headlines",
  },
  {
    id: "deals",
    label: "Deals",
    description: "M&A and merger activity",
  },
  {
    id: "watchlist",
    label: "On your watchlist",
    description: "Headlines tagging symbols you track",
  },
];

export function parseMarketHeadlineLane(raw: string | undefined): MarketHeadlineLane {
  if (raw === "crypto" || raw === "deals" || raw === "watchlist") return raw;
  return "market";
}

export function parseRelatedSymbols(related?: string): string[] {
  if (!related?.trim()) return [];
  return related
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function headlineMatchesWatchlist(
  relatedSymbols: string[],
  watchlist: Set<string>
): boolean {
  return relatedSymbols.some((s) => watchlist.has(s));
}

function mapHeadline(
  item: MarketNewsItem,
  category: MarketNewsCategory,
  watchlist: Set<string>
): MarketHeadline {
  const relatedSymbols = parseRelatedSymbols(item.related);
  return {
    id: item.id,
    headline: item.headline,
    summary: item.summary ?? "",
    source: item.source,
    url: item.url,
    datetime: item.datetime,
    category,
    relatedSymbols,
    onWatchlist: headlineMatchesWatchlist(relatedSymbols, watchlist),
  };
}

function getDemoMarketHeadlines(
  lane: MarketHeadlineLane,
  watchlistSymbols: string[]
): MarketHeadline[] {
  const now = Math.floor(Date.now() / 1000);
  const watchlist = new Set(watchlistSymbols.map((s) => s.toUpperCase()));
  const all: MarketHeadline[] = [
    {
      id: 9001,
      headline: "Fed officials signal data-dependent path after latest inflation print",
      summary: "",
      source: "Demo Wire",
      url: "https://example.com/fed",
      datetime: now - 3600,
      category: "general",
      relatedSymbols: ["SPY", "QQQ"],
      onWatchlist: headlineMatchesWatchlist(["SPY", "QQQ"], watchlist),
    },
    {
      id: 9002,
      headline: "Semiconductor names rally on datacenter demand outlook",
      summary: "",
      source: "Demo Wire",
      url: "https://example.com/semis",
      datetime: now - 7200,
      category: "general",
      relatedSymbols: ["NVDA", "AMD"],
      onWatchlist: headlineMatchesWatchlist(["NVDA", "AMD"], watchlist),
    },
    {
      id: 9003,
      headline: "Bitcoin holds range as ETF inflows stay positive",
      summary: "",
      source: "Demo Crypto",
      url: "https://example.com/btc",
      datetime: now - 5400,
      category: "crypto",
      relatedSymbols: ["BTC"],
      onWatchlist: headlineMatchesWatchlist(["BTC"], watchlist),
    },
    {
      id: 9004,
      headline: "Solana ecosystem volumes climb ahead of network upgrade",
      summary: "",
      source: "Demo Crypto",
      url: "https://example.com/sol",
      datetime: now - 9800,
      category: "crypto",
      relatedSymbols: ["SOL"],
      onWatchlist: headlineMatchesWatchlist(["SOL"], watchlist),
    },
    {
      id: 9005,
      headline: "Large-cap software firm explores strategic alternatives",
      summary: "",
      source: "Demo Deals",
      url: "https://example.com/merger",
      datetime: now - 14400,
      category: "merger",
      relatedSymbols: ["MSFT"],
      onWatchlist: headlineMatchesWatchlist(["MSFT"], watchlist),
    },
  ];

  if (lane === "watchlist") {
    return all.filter((h) => h.onWatchlist);
  }
  if (lane === "crypto") {
    return all.filter((h) => h.category === "crypto");
  }
  if (lane === "deals") {
    return all.filter((h) => h.category === "merger");
  }
  return all.filter((h) => h.category === "general");
}

function laneCategory(lane: MarketHeadlineLane): MarketNewsCategory | null {
  if (lane === "crypto") return "crypto";
  if (lane === "deals") return "merger";
  if (lane === "market") return "general";
  return null;
}

export async function fetchMarketHeadlinesByLane(
  lane: MarketHeadlineLane,
  watchlistSymbols: string[] = []
): Promise<MarketHeadline[]> {
  if (isDemoMode()) {
    return getDemoMarketHeadlines(lane, watchlistSymbols);
  }

  const watchlist = new Set(watchlistSymbols.map((s) => s.toUpperCase()));

  if (lane === "watchlist") {
    if (watchlist.size === 0) return [];

    const [general, crypto, merger] = await Promise.all([
      getMarketNews("general"),
      getMarketNews("crypto"),
      getMarketNews("merger"),
    ]);

    const merged = [
      ...general.map((item) => mapHeadline(item, "general", watchlist)),
      ...crypto.map((item) => mapHeadline(item, "crypto", watchlist)),
      ...merger.map((item) => mapHeadline(item, "merger", watchlist)),
    ];

    const seen = new Set<number>();
    const out: MarketHeadline[] = [];
    for (const row of merged.sort((a, b) => b.datetime - a.datetime)) {
      if (!row.onWatchlist || seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
      if (out.length >= 40) break;
    }
    return out;
  }

  const category = laneCategory(lane)!;
  const rows = await getMarketNews(category);
  return rows
    .slice(0, 40)
    .map((item) => mapHeadline(item, category, watchlist));
}

/** Compact preview for watchlist widget — watchlist hits first, then market fill. */
export async function fetchMarketHeadlinesPreview(
  watchlistSymbols: string[],
  limit = 5
): Promise<MarketHeadline[]> {
  const [market, watchlist] = await Promise.all([
    fetchMarketHeadlinesByLane("market", watchlistSymbols),
    watchlistSymbols.length > 0
      ? fetchMarketHeadlinesByLane("watchlist", watchlistSymbols)
      : Promise.resolve([]),
  ]);

  const seen = new Set<number>();
  const out: MarketHeadline[] = [];

  for (const row of watchlist.slice(0, 2)) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }

  for (const row of market) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
    if (out.length >= limit) break;
  }

  return out.slice(0, limit);
}
