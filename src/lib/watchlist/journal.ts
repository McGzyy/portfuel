import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getQuote } from "@/lib/market/finnhub";
import type {
  WatchlistJournal,
  WatchlistJournalEntry,
  WatchlistJournalPatch,
} from "@/lib/watchlist/journal-types";

type WatchlistRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  created_at: string;
  baseline_price: number | null;
  thesis: string | null;
  conviction: number | null;
  entry_price: number | null;
  stop_price: number | null;
  target_price: number | null;
  entry_note: string | null;
  journal_updated_at: string | null;
};

function mapJournalRow(row: WatchlistRow, lastPrice?: number | null): WatchlistJournal {
  return {
    symbol: row.symbol,
    asset_class: row.asset_class,
    created_at: row.created_at,
    baseline_price: row.baseline_price != null ? Number(row.baseline_price) : null,
    last_price: lastPrice ?? null,
    thesis: row.thesis,
    conviction: row.conviction,
    entry_price: row.entry_price != null ? Number(row.entry_price) : null,
    stop_price: row.stop_price != null ? Number(row.stop_price) : null,
    target_price: row.target_price != null ? Number(row.target_price) : null,
    entry_note: row.entry_note,
    journal_updated_at: row.journal_updated_at,
  };
}

export async function resolveJournalMarkerPrice(symbol: string): Promise<number | null> {
  return lastPriceForSymbol(symbol);
}

async function lastPriceForSymbol(symbol: string): Promise<number | null> {
  const sym = symbol.toUpperCase();
  const db = createServiceClient();
  const { data } = await db
    .from("ticker_snapshots")
    .select("last_price")
    .eq("symbol", sym)
    .maybeSingle();
  if (data?.last_price != null) {
    const p = Number(data.last_price);
    if (p > 0) return p;
  }
  const quote = await getQuote(sym, { fresh: true });
  const live = quote?.c ?? quote?.pc;
  if (live != null && Number.isFinite(live) && live > 0) {
    return Math.round(live * 10000) / 10000;
  }
  return null;
}

export async function fetchWatchlistJournal(
  userId: string,
  symbol: string
): Promise<WatchlistJournal | null> {
  if (isDemoMode()) return null;

  const sym = symbol.toUpperCase().trim();
  const db = createServiceClient();
  const { data, error } = await db
    .from("user_watchlist")
    .select(
      "symbol, asset_class, created_at, baseline_price, thesis, conviction, entry_price, stop_price, target_price, entry_note, journal_updated_at"
    )
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const last = await lastPriceForSymbol(sym);
  return mapJournalRow(data as WatchlistRow, last);
}

export async function updateWatchlistJournal(
  userId: string,
  symbol: string,
  patch: WatchlistJournalPatch
): Promise<{ ok: true; journal: WatchlistJournal } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const sym = symbol.toUpperCase().trim();
  const db = createServiceClient();

  const existing = await fetchWatchlistJournal(userId, sym);
  if (!existing) return { error: "not_on_watchlist" };

  const updates: Record<string, unknown> = {
    journal_updated_at: new Date().toISOString(),
  };

  if (patch.thesis !== undefined) {
    const t = patch.thesis?.trim() ?? "";
    updates.thesis = t.length > 0 ? t.slice(0, 4000) : null;
  }
  if (patch.conviction !== undefined) {
    const c = patch.conviction;
    updates.conviction =
      c != null && Number.isFinite(c) ? Math.min(10, Math.max(1, Math.round(c))) : null;
  }
  if (patch.entry_price !== undefined) {
    updates.entry_price = normalizePrice(patch.entry_price);
  }
  if (patch.stop_price !== undefined) {
    updates.stop_price = normalizePrice(patch.stop_price);
  }
  if (patch.target_price !== undefined) {
    updates.target_price = normalizePrice(patch.target_price);
  }
  if (patch.entry_note !== undefined) {
    const n = patch.entry_note?.trim() ?? "";
    updates.entry_note = n.length > 0 ? n.slice(0, 500) : null;
  }

  const { error } = await db
    .from("user_watchlist")
    .update(updates as never)
    .eq("user_id", userId)
    .eq("symbol", sym);

  if (error) {
    console.error("[watchlist/journal/update]", error);
    return { error: "db_error" };
  }

  const convictionAfter = updates.conviction as number | null | undefined;
  if (
    convictionAfter !== undefined &&
    convictionAfter !== null &&
    convictionAfter !== existing.conviction
  ) {
    await addJournalEntry(userId, sym, {
      body: `Conviction updated to ${convictionAfter}.`,
      conviction_after: convictionAfter,
    });
  }

  const journal = await fetchWatchlistJournal(userId, sym);
  if (!journal) return { error: "db_error" };
  return { ok: true, journal };
}

function normalizePrice(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 10000) / 10000;
}

export async function fetchJournalEntries(
  userId: string,
  symbol: string
): Promise<WatchlistJournalEntry[]> {
  if (isDemoMode()) return [];

  const sym = symbol.toUpperCase().trim();
  const db = createServiceClient();
  const { data, error } = await db
    .from("watchlist_journal_entries")
    .select("id, body, reply_to_id, conviction_after, marker_price, created_at")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WatchlistJournalEntry[];
}

export async function addJournalEntry(
  userId: string,
  symbol: string,
  input: {
    body: string;
    reply_to_id?: string | null;
    conviction_after?: number | null;
  }
): Promise<{ ok: true; entry: WatchlistJournalEntry } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const sym = symbol.toUpperCase().trim();
  const body = input.body.trim();
  if (!body) return { error: "empty_body" };

  const onList = await fetchWatchlistJournal(userId, sym);
  if (!onList) return { error: "not_on_watchlist" };

  const db = createServiceClient();
  const conviction_after =
    input.conviction_after != null && Number.isFinite(input.conviction_after)
      ? Math.min(10, Math.max(1, Math.round(input.conviction_after)))
      : null;

  const marker_price = await resolveJournalMarkerPrice(sym);

  const { data, error } = await db
    .from("watchlist_journal_entries")
    .insert({
      user_id: userId,
      symbol: sym,
      body: body.slice(0, 4000),
      reply_to_id: input.reply_to_id ?? null,
      conviction_after,
      marker_price,
    } as never)
    .select("id, body, reply_to_id, conviction_after, marker_price, created_at")
    .single();

  if (error) {
    console.error("[watchlist/journal/entry]", error);
    return { error: "db_error" };
  }

  await db
    .from("user_watchlist")
    .update({ journal_updated_at: new Date().toISOString() } as never)
    .eq("user_id", userId)
    .eq("symbol", sym);

  return { ok: true, entry: data as WatchlistJournalEntry };
}

/** Quote at add time for move alerts. */
export async function resolveBaselinePrice(symbol: string): Promise<number | null> {
  const quote = await getQuote(symbol, { fresh: true });
  const price = quote?.c ?? quote?.pc;
  if (price == null || !Number.isFinite(price) || price <= 0) return null;
  return Math.round(price * 10000) / 10000;
}
