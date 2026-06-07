import { getDemoLeaderboard } from "@/lib/demo/fixtures";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoWatchlistSeed } from "@/lib/watchlist/demo";
import { memberPublicPath } from "@/lib/dashboard/nav";
import { getCoreCryptoAsset } from "@/lib/market/crypto-allowlist";
import { resolveWatchlistSymbol } from "@/lib/market/validate-symbol";
import { createServiceClient } from "@/lib/db/supabase";
import { fetchWatchlist } from "@/lib/watchlist/service";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { searchWorkspacePages } from "@/lib/search/workspace-pages";
import { buildSymbolSearchResult } from "@/lib/search/symbol-links";
import { searchMarketHeadlines } from "@/lib/search/headlines-search";
import { searchJournalEntries } from "@/lib/search/journal-entries-search";
import {
  getCachedSearch,
  searchCacheKey,
  setCachedSearch,
} from "@/lib/search/search-cache";
import type {
  SearchMemberResult,
  SearchSymbolResult,
  WorkspaceSearchResults,
} from "@/lib/search/types";

const SYMBOL_LIMIT = 6;
const MEMBER_LIMIT = 5;
const RECENT_LIMIT = 8;

function normalizeQuery(raw: string): string {
  return raw.trim();
}

function memberQuery(raw: string): string {
  return raw.replace(/^@+/, "").trim();
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function looksLikeTicker(raw: string): boolean {
  return /^[A-Z0-9.-]{1,12}$/i.test(raw.trim());
}

function watchlistMap(items: WatchlistEntry[]): Map<string, WatchlistEntry> {
  return new Map(items.map((item) => [item.symbol.toUpperCase(), item]));
}

function symbolFromWatchlist(entry: WatchlistEntry): SearchSymbolResult {
  return buildSymbolSearchResult({
    symbol: entry.symbol,
    assetClass: (entry.asset_class ?? "equity") as "equity" | "crypto",
    name: getCoreCryptoAsset(entry.symbol)?.display_name ?? undefined,
    onWatchlist: true,
    lastPrice: entry.last_price ?? null,
  });
}

async function searchWatchlistSymbols(
  userId: string,
  query: string,
  items: WatchlistEntry[]
): Promise<WatchlistEntry[]> {
  if (isDemoMode()) {
    return getDemoWatchlistSeed()
      .filter((row) => row.symbol.includes(query.toUpperCase()))
      .map((row) => ({
        symbol: row.symbol,
        asset_class: row.asset_class,
        last_price: null,
      })) as WatchlistEntry[];
  }

  const q = query.toUpperCase();
  return items.filter((item) => item.symbol.includes(q));
}

async function searchMembers(
  userId: string,
  query: string
): Promise<SearchMemberResult[]> {
  const q = memberQuery(query);
  if (q.length < 2) return [];

  const needle = q.toLowerCase();

  if (isDemoMode()) {
    const rows: SearchMemberResult[] = [];
    for (const row of getDemoLeaderboard(50)) {
      if (!row.username) continue;
      const uname = row.username;
      if (
        !uname.toLowerCase().includes(needle) &&
        !(row.display_name ?? "").toLowerCase().includes(needle)
      ) {
        continue;
      }
      rows.push({
        username: uname,
        displayName: row.display_name,
        href: memberPublicPath(uname),
      });
      if (rows.length >= MEMBER_LIMIT) break;
    }
    return rows;
  }

  const db = createServiceClient();
  const pattern = `${escapeIlike(q)}%`;
  const { data, error } = await db
    .from("users")
    .select("username, display_name")
    .eq("subscription_status", "active")
    .neq("id", userId)
    .or(`username.ilike.${pattern},display_name.ilike.%${escapeIlike(q)}%`)
    .order("username", { ascending: true })
    .limit(MEMBER_LIMIT);

  if (error) {
    console.error("[search/members]", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as { username: string; display_name: string | null };
    return {
      username: r.username,
      displayName: r.display_name,
      href: memberPublicPath(r.username),
    };
  });
}

async function resolveTickerSymbol(
  query: string,
  watchlistSymbols: Set<string>
): Promise<SearchSymbolResult | null> {
  if (!looksLikeTicker(query)) return null;

  const sym = query.toUpperCase();
  if (watchlistSymbols.has(sym)) return null;

  const core = getCoreCryptoAsset(sym);
  if (core) {
    const validated = await resolveWatchlistSymbol(sym);
    return buildSymbolSearchResult({
      symbol: sym,
      assetClass: "crypto",
      name: core.display_name ?? undefined,
      onWatchlist: false,
      lastPrice: validated.ok ? validated.lastPrice ?? null : null,
    });
  }

  const validated = await resolveWatchlistSymbol(sym);
  if (!validated.ok) return null;

  return buildSymbolSearchResult({
    symbol: validated.symbol,
    assetClass: validated.assetClass,
    name: validated.name,
    onWatchlist: false,
    lastPrice: validated.lastPrice ?? null,
  });
}

export async function resolveRecentTickers(
  userId: string,
  symbols: string[],
  watchlistItems: WatchlistEntry[]
): Promise<SearchSymbolResult[]> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase().trim()).filter(Boolean))].slice(
    0,
    RECENT_LIMIT
  );
  if (unique.length === 0) return [];

  const onWatchlist = watchlistMap(watchlistItems);
  const out: SearchSymbolResult[] = [];

  await Promise.all(
    unique.map(async (sym) => {
      const listed = onWatchlist.get(sym);
      if (listed) {
        out.push(symbolFromWatchlist(listed));
        return;
      }

      const core = getCoreCryptoAsset(sym);
      if (core) {
        const validated = await resolveWatchlistSymbol(sym);
        if (validated.ok) {
          out.push(
            buildSymbolSearchResult({
              symbol: sym,
              assetClass: "crypto",
              name: core.display_name ?? undefined,
              onWatchlist: false,
              lastPrice: validated.lastPrice ?? null,
            })
          );
        }
        return;
      }

      const validated = await resolveWatchlistSymbol(sym);
      if (validated.ok) {
        out.push(
          buildSymbolSearchResult({
            symbol: validated.symbol,
            assetClass: validated.assetClass,
            name: validated.name,
            onWatchlist: false,
            lastPrice: validated.lastPrice ?? null,
          })
        );
      }
    })
  );

  const order = new Map(unique.map((sym, index) => [sym, index]));
  return out.sort(
    (a, b) => (order.get(a.symbol) ?? 999) - (order.get(b.symbol) ?? 999)
  );
}

export async function searchWorkspace(
  userId: string,
  rawQuery: string,
  opts?: { recentSymbols?: string[] }
): Promise<WorkspaceSearchResults> {
  const query = normalizeQuery(rawQuery);
  const recentSymbols = opts?.recentSymbols ?? [];
  const cacheKey = searchCacheKey(userId, query, recentSymbols);
  const cached = getCachedSearch(cacheKey, query);
  if (cached) return cached;

  const pages = searchWorkspacePages(query);

  const watchlistItems = isDemoMode()
    ? (getDemoWatchlistSeed().map((row) => ({
        symbol: row.symbol,
        asset_class: row.asset_class,
        last_price: null,
      })) as WatchlistEntry[])
    : await fetchWatchlist(userId);

  const watchlistSymbolList = watchlistItems.map((item) => item.symbol);

  if (!query) {
    const recent =
      recentSymbols.length > 0
        ? await resolveRecentTickers(userId, recentSymbols, watchlistItems)
        : [];

    const emptyResults: WorkspaceSearchResults = {
      query,
      recent,
      symbols: [],
      journalEntries: [],
      members: [],
      pages,
      headlines: [],
    };
    setCachedSearch(cacheKey, emptyResults);
    return emptyResults;
  }

  const upper = query.toUpperCase();
  const watchlistMatches = await searchWatchlistSymbols(userId, upper, watchlistItems);
  const watchlistSet = new Set(watchlistMatches.map((row) => row.symbol.toUpperCase()));

  const symbols: SearchSymbolResult[] = watchlistMatches
    .slice(0, SYMBOL_LIMIT)
    .map((row) => symbolFromWatchlist(row));

  if (symbols.length < SYMBOL_LIMIT && looksLikeTicker(query)) {
    const resolved = await resolveTickerSymbol(query, watchlistSet);
    if (resolved) symbols.push(resolved);
  }

  const members =
    memberQuery(query).length >= 2 &&
    (query.startsWith("@") || !looksLikeTicker(query))
      ? await searchMembers(userId, query)
      : [];

  const headlines = await searchMarketHeadlines(query, watchlistSymbolList);
  const journalEntries = await searchJournalEntries(userId, query);

  const results: WorkspaceSearchResults = {
    query,
    recent: [],
    symbols: symbols.slice(0, SYMBOL_LIMIT),
    journalEntries,
    members,
    pages,
    headlines,
  };
  setCachedSearch(cacheKey, results);
  return results;
}
