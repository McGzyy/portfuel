import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoWatchlist } from "@/lib/watchlist/demo";
import { detectAssetClassForSymbol } from "@/lib/watchlist/symbol-detect";
import type { WatchlistEntry } from "@/lib/watchlist/types";

const MAX_WATCHLIST = 24;

export async function fetchWatchlist(userId: string): Promise<WatchlistEntry[]> {
  if (isDemoMode()) return getDemoWatchlist(userId);

  const db = createServiceClient();
  const { data, error } = await db
    .from("user_watchlist")
    .select("symbol, asset_class, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const entries = (data ?? []) as WatchlistEntry[];
  return enrichWatchlistQuotes(entries);
}

export async function addToWatchlist(
  userId: string,
  symbol: string
): Promise<{ ok: true } | { error: string }> {
  const sym = symbol.toUpperCase().trim();
  if (!sym || sym.length > 12) return { error: "invalid_symbol" };

  if (isDemoMode()) {
    return { error: "demo_readonly" };
  }

  const db = createServiceClient();
  const { count } = await db
    .from("user_watchlist")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= MAX_WATCHLIST) return { error: "watchlist_full" };

  const asset_class = await detectAssetClassForSymbol(sym);

  const { error } = await db.from("user_watchlist").upsert(
    {
      user_id: userId,
      symbol: sym,
      asset_class,
    } as never,
    { onConflict: "user_id,symbol" }
  );

  if (error) {
    console.error("[watchlist/add]", error);
    return { error: "db_error" };
  }
  return { ok: true };
}

export async function removeFromWatchlist(
  userId: string,
  symbol: string
): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const { error } = await db
    .from("user_watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", symbol.toUpperCase());

  if (error) {
    console.error("[watchlist/remove]", error);
    return { error: "db_error" };
  }
  return { ok: true };
}

async function enrichWatchlistQuotes(entries: WatchlistEntry[]): Promise<WatchlistEntry[]> {
  if (entries.length === 0) return entries;

  const db = createServiceClient();
  const symbols = entries.map((e) => e.symbol);

  const { data: snaps } = await db
    .from("ticker_snapshots")
    .select("symbol, last_price")
    .in("symbol", symbols);

  const priceMap = new Map((snaps ?? []).map((s) => [s.symbol, s.last_price]));

  const { data: recentCalls } = await db
    .from("calls")
    .select("symbol, return_pct, called_at")
    .in("symbol", symbols)
    .order("called_at", { ascending: false });

  const returnMap = new Map<string, number | null>();
  for (const c of recentCalls ?? []) {
    if (!returnMap.has(c.symbol)) returnMap.set(c.symbol, c.return_pct);
  }

  return entries.map((e) => ({
    ...e,
    last_price: priceMap.get(e.symbol) ?? null,
    return_pct: returnMap.get(e.symbol) ?? null,
  }));
}
