import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getQuote } from "@/lib/market/finnhub";
import { getDemoWatchlist } from "@/lib/watchlist/demo";
import { detectAssetClassForSymbol } from "@/lib/watchlist/symbol-detect";
import { enrichWatchlistActivity } from "@/lib/watchlist/activity";
import { addJournalEntry, resolveBaselinePrice } from "@/lib/watchlist/journal";
import type { WatchlistEntry } from "@/lib/watchlist/types";

const MAX_WATCHLIST = 24;

export const WATCHLIST_MOVE_ALERT_PCT = 5;

export async function fetchWatchlist(userId: string): Promise<WatchlistEntry[]> {
  if (isDemoMode()) return getDemoWatchlist(userId);

  const db = createServiceClient();
  const { data, error } = await db
    .from("user_watchlist")
    .select(
      "symbol, asset_class, created_at, baseline_price, conviction, thesis, journal_updated_at, outcome, catalysts"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const entries = (data ?? []) as WatchlistEntry[];
  const withQuotes = await enrichWatchlistQuotes(entries);
  return enrichWatchlistActivity(userId, withQuotes);
}

export async function addToWatchlist(
  userId: string,
  symbol: string,
  opts?: { thesis?: string; conviction?: number }
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

  const thesis = opts?.thesis?.trim();
  const conviction =
    opts?.conviction != null && Number.isFinite(opts.conviction)
      ? Math.min(10, Math.max(1, Math.round(opts.conviction)))
      : null;

  const { data: existing } = await db
    .from("user_watchlist")
    .select("symbol, baseline_price")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (thesis && thesis.length > 0) {
      patch.thesis = thesis.slice(0, 4000);
      patch.journal_updated_at = new Date().toISOString();
    }
    if (conviction != null) patch.conviction = conviction;
    if (Object.keys(patch).length > 0) {
      const { error: patchErr } = await db
        .from("user_watchlist")
        .update(patch as never)
        .eq("user_id", userId)
        .eq("symbol", sym);
      if (patchErr) {
        console.error("[watchlist/add patch]", patchErr);
        return { error: "db_error" };
      }
    }
    return { ok: true };
  }

  const baseline_price = await resolveBaselinePrice(sym);
  const row: Record<string, unknown> = {
    user_id: userId,
    symbol: sym,
    asset_class,
    baseline_price,
  };
  if (thesis && thesis.length > 0) {
    row.thesis = thesis.slice(0, 4000);
    row.journal_updated_at = new Date().toISOString();
  }
  if (conviction != null) row.conviction = conviction;

  const { error } = await db.from("user_watchlist").insert(row as never);

  if (error) {
    console.error("[watchlist/add]", error);
    return { error: "db_error" };
  }

  await addJournalEntry(userId, sym, {
    body: thesis && thesis.length > 0 ? "Added to watchlist." : "Added to watchlist — add your thesis on the journal page.",
    conviction_after: conviction,
  });

  return { ok: true };
}

export async function addOpenPortfolioToWatchlist(
  userId: string
): Promise<
  | { ok: true; added: number; alreadyOnList: number; watchlistFull: boolean }
  | { error: string }
> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const { data: openPositions } = await db
    .from("desk_portfolio")
    .select("symbol")
    .eq("status", "open");

  const symbols = [...new Set((openPositions ?? []).map((r) => (r as { symbol: string }).symbol))];
  if (symbols.length === 0) {
    return { ok: true, added: 0, alreadyOnList: 0, watchlistFull: false };
  }

  const { data: existing } = await db
    .from("user_watchlist")
    .select("symbol")
    .eq("user_id", userId);

  const onList = new Set((existing ?? []).map((r) => (r as { symbol: string }).symbol));
  let added = 0;
  let alreadyOnList = 0;
  let watchlistFull = false;

  for (const sym of symbols) {
    if (onList.has(sym)) {
      alreadyOnList++;
      continue;
    }
    const result = await addToWatchlist(userId, sym);
    if ("error" in result) {
      if (result.error === "watchlist_full") {
        watchlistFull = true;
        break;
      }
      continue;
    }
    added++;
    onList.add(sym);
  }

  return { ok: true, added, alreadyOnList, watchlistFull };
}

export async function isSymbolOnWatchlist(userId: string, symbol: string): Promise<boolean> {
  if (isDemoMode()) return false;

  const db = createServiceClient();
  const { data } = await db
    .from("user_watchlist")
    .select("symbol")
    .eq("user_id", userId)
    .eq("symbol", symbol.toUpperCase())
    .maybeSingle();

  return Boolean(data);
}

export async function removeFromWatchlist(
  userId: string,
  symbol: string
): Promise<{ ok: true } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const db = createServiceClient();
  const sym = symbol.toUpperCase();
  await db
    .from("watchlist_journal_entries")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", sym);

  const { error } = await db
    .from("user_watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", sym);

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

  return entries.map((e) => {
    const last = priceMap.get(e.symbol) ?? null;
    const baseline = e.baseline_price != null ? Number(e.baseline_price) : null;
    let change_since_add_pct: number | null = null;
    if (baseline != null && baseline > 0 && last != null) {
      change_since_add_pct = ((last - baseline) / baseline) * 100;
    }
    const row = e as WatchlistEntry & {
      thesis?: string | null;
      conviction?: number | null;
      journal_updated_at?: string | null;
      outcome?: string | null;
      catalysts?: string[] | null;
    };
    return {
      ...row,
      baseline_price: baseline,
      last_price: last,
      return_pct: returnMap.get(e.symbol) ?? null,
      change_since_add_pct,
      has_thesis: Boolean(row.thesis?.trim()),
      catalyst_count: row.catalysts?.length ?? 0,
    };
  });
}
