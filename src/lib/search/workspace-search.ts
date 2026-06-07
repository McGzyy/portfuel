import { getDemoLeaderboard } from "@/lib/demo/fixtures";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoWatchlistSeed } from "@/lib/watchlist/demo";
import { memberPublicPath } from "@/lib/dashboard/nav";
import { getCoreCryptoAsset } from "@/lib/market/crypto-allowlist";
import { resolveWatchlistSymbol } from "@/lib/market/validate-symbol";
import { createServiceClient } from "@/lib/db/supabase";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { searchWorkspacePages } from "@/lib/search/workspace-pages";
import { buildSymbolSearchResult } from "@/lib/search/symbol-links";
import type {
  SearchMemberResult,
  SearchSymbolResult,
  WorkspaceSearchResults,
} from "@/lib/search/types";

const SYMBOL_LIMIT = 6;
const MEMBER_LIMIT = 5;

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

async function searchWatchlistSymbols(
  userId: string,
  query: string
): Promise<{ symbol: string; asset_class: "equity" | "crypto" }[]> {
  if (isDemoMode()) {
    return getDemoWatchlistSeed()
      .map((row) => ({ symbol: row.symbol, asset_class: row.asset_class }))
      .filter((row) => row.symbol.includes(query.toUpperCase()));
  }

  const items = await fetchWatchlist(userId);
  const q = query.toUpperCase();
  return items
    .filter((item) => item.symbol.includes(q))
    .map((item) => ({
      symbol: item.symbol,
      asset_class: (item.asset_class ?? "equity") as "equity" | "crypto",
    }));
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
    return buildSymbolSearchResult({
      symbol: sym,
      assetClass: "crypto",
      name: core.display_name ?? undefined,
      onWatchlist: false,
    });
  }

  const validated = await resolveWatchlistSymbol(sym);
  if (!validated.ok) return null;

  return buildSymbolSearchResult({
    symbol: validated.symbol,
    assetClass: validated.assetClass,
    name: validated.name,
    onWatchlist: false,
  });
}

export async function searchWorkspace(
  userId: string,
  rawQuery: string
): Promise<WorkspaceSearchResults> {
  const query = normalizeQuery(rawQuery);
  const pages = searchWorkspacePages(query);

  if (!query) {
    return { query, symbols: [], members: [], pages };
  }

  const upper = query.toUpperCase();
  const watchlistMatches = await searchWatchlistSymbols(userId, upper);
  const watchlistSet = new Set(watchlistMatches.map((row) => row.symbol));

  const symbols: SearchSymbolResult[] = watchlistMatches
    .slice(0, SYMBOL_LIMIT)
    .map((row) =>
      buildSymbolSearchResult({
        symbol: row.symbol,
        assetClass: row.asset_class,
        name: getCoreCryptoAsset(row.symbol)?.display_name ?? undefined,
        onWatchlist: true,
      })
    );

  if (symbols.length < SYMBOL_LIMIT && looksLikeTicker(query)) {
    const resolved = await resolveTickerSymbol(query, watchlistSet);
    if (resolved) symbols.push(resolved);
  }

  const members =
    memberQuery(query).length >= 2 &&
    (query.startsWith("@") || !looksLikeTicker(query))
      ? await searchMembers(userId, query)
      : [];

  return {
    query,
    symbols: symbols.slice(0, SYMBOL_LIMIT),
    members,
    pages,
  };
}
