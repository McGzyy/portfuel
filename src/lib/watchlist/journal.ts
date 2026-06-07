import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getQuote } from "@/lib/market/finnhub";
import {
  normalizeCatalysts,
  normalizeJournalEntryType,
  normalizePersonalTags,
  type JournalEntryType,
  type JournalOutcome,
} from "@/lib/watchlist/journal-meta";
import { parseResearchMetadata } from "@/lib/journal/research-entry";
import {
  getDemoJournalEntries,
  getDemoWatchlistJournal,
  isDemoJournalSymbol,
} from "@/lib/watchlist/journal-demo";
import type {
  WatchlistJournal,
  WatchlistJournalEntry,
  WatchlistJournalPatch,
} from "@/lib/watchlist/journal-types";
import {
  diffJournalPlanRevisions,
  recordJournalPlanRevisions,
} from "@/lib/watchlist/journal-revisions";
import {
  isSchemaDriftError,
  JOURNAL_BASIC_SELECT,
  JOURNAL_FULL_SELECT,
} from "@/lib/watchlist/db-select";

const JOURNAL_SELECT = JOURNAL_FULL_SELECT;

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
  catalysts: string[] | null;
  risk_factors: string | null;
  personal_tags: string[] | null;
  outcome: JournalOutcome;
  bull_case_price: number | null;
  base_case_price: number | null;
  bear_case_price: number | null;
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
    catalysts: normalizeCatalysts(row.catalysts),
    risk_factors: row.risk_factors,
    personal_tags: normalizePersonalTags(row.personal_tags),
    outcome: row.outcome ?? "watching",
    bull_case_price: row.bull_case_price != null ? Number(row.bull_case_price) : null,
    base_case_price: row.base_case_price != null ? Number(row.base_case_price) : null,
    bear_case_price: row.bear_case_price != null ? Number(row.bear_case_price) : null,
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
  const sym = symbol.toUpperCase().trim();
  if (isDemoMode()) {
    return isDemoJournalSymbol(sym) ? getDemoWatchlistJournal(sym) : null;
  }
  const db = createServiceClient();
  const primary = await db
    .from("user_watchlist")
    .select(JOURNAL_SELECT)
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  let data: WatchlistRow | null = primary.data as WatchlistRow | null;
  let error = primary.error;

  if (error && isSchemaDriftError(error)) {
    const fallback = await db
      .from("user_watchlist")
      .select(JOURNAL_BASIC_SELECT)
      .eq("user_id", userId)
      .eq("symbol", sym)
      .maybeSingle();
    data = fallback.data as WatchlistRow | null;
    error = fallback.error;
  }

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

  const revisionRows = diffJournalPlanRevisions(existing, patch);

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
  if (patch.catalysts !== undefined) {
    updates.catalysts = normalizeCatalysts(patch.catalysts);
  }
  if (patch.risk_factors !== undefined) {
    const r = patch.risk_factors?.trim() ?? "";
    updates.risk_factors = r.length > 0 ? r.slice(0, 2000) : null;
  }
  if (patch.personal_tags !== undefined) {
    updates.personal_tags = normalizePersonalTags(patch.personal_tags);
  }
  if (patch.outcome !== undefined) {
    updates.outcome = patch.outcome;
  }
  if (patch.bull_case_price !== undefined) {
    updates.bull_case_price = normalizePrice(patch.bull_case_price);
  }
  if (patch.base_case_price !== undefined) {
    updates.base_case_price = normalizePrice(patch.base_case_price);
  }
  if (patch.bear_case_price !== undefined) {
    updates.bear_case_price = normalizePrice(patch.bear_case_price);
  }

  const outcomeAfter = updates.outcome as JournalOutcome | undefined;

  const { error } = await db
    .from("user_watchlist")
    .update(updates as never)
    .eq("user_id", userId)
    .eq("symbol", sym);

  if (error) {
    console.error("[watchlist/journal/update]", error);
    return { error: "db_error" };
  }

  if (revisionRows.length > 0) {
    await recordJournalPlanRevisions(userId, sym, revisionRows);
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
      entry_type: "system",
    });
  }

  if (outcomeAfter !== undefined && outcomeAfter !== existing.outcome) {
    await addJournalEntry(userId, sym, {
      body: `Outcome set to ${outcomeAfter.replace(/_/g, " ")}.`,
      entry_type: "system",
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

function mapEntryRow(row: {
  id: string;
  body: string;
  entry_type?: string | null;
  metadata?: unknown;
  reply_to_id: string | null;
  conviction_after: number | null;
  marker_price: number | null;
  created_at: string;
}): WatchlistJournalEntry {
  const entry_type = normalizeJournalEntryType(row.entry_type);
  return {
    id: row.id,
    body: row.body,
    entry_type,
    metadata:
      entry_type === "ai_research" ? parseResearchMetadata(row.metadata) : null,
    reply_to_id: row.reply_to_id,
    conviction_after: row.conviction_after,
    marker_price: row.marker_price != null ? Number(row.marker_price) : null,
    created_at: row.created_at,
  };
}

export async function fetchJournalEntries(
  userId: string,
  symbol: string
): Promise<WatchlistJournalEntry[]> {
  const sym = symbol.toUpperCase().trim();
  if (isDemoMode()) {
    return isDemoJournalSymbol(sym) ? getDemoJournalEntries(sym) : [];
  }
  const db = createServiceClient();
  const primary = await db
    .from("watchlist_journal_entries")
    .select("id, body, entry_type, metadata, reply_to_id, conviction_after, marker_price, created_at")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .order("created_at", { ascending: true });

  let data = primary.data as Parameters<typeof mapEntryRow>[0][] | null;
  let error = primary.error;

  if (error && isSchemaDriftError(error)) {
    const fallback = await db
      .from("watchlist_journal_entries")
      .select("id, body, reply_to_id, conviction_after, marker_price, created_at")
      .eq("user_id", userId)
      .eq("symbol", sym)
      .order("created_at", { ascending: true });
    data = fallback.data as Parameters<typeof mapEntryRow>[0][] | null;
    error = fallback.error;
  }

  if (error) {
    if (isSchemaDriftError(error)) return [];
    throw error;
  }
  return (data ?? []).map((row) => mapEntryRow(row as Parameters<typeof mapEntryRow>[0]));
}

export async function addJournalEntry(
  userId: string,
  symbol: string,
  input: {
    body: string;
    reply_to_id?: string | null;
    conviction_after?: number | null;
    entry_type?: JournalEntryType;
    metadata?: Record<string, unknown> | null;
  }
): Promise<{ ok: true; entry: WatchlistJournalEntry } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const sym = symbol.toUpperCase().trim();
  const body = input.body.trim();
  if (!body) return { error: "empty_body" };

  const db = createServiceClient();
  const onList = await db
    .from("user_watchlist")
    .select("symbol")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();
  if (onList.error) {
    console.error("[watchlist/journal/on-list]", onList.error);
    return { error: "db_error" };
  }
  if (!onList.data) return { error: "not_on_watchlist" };

  const conviction_after =
    input.conviction_after != null && Number.isFinite(input.conviction_after)
      ? Math.min(10, Math.max(1, Math.round(input.conviction_after)))
      : null;

  const entry_type = normalizeJournalEntryType(input.entry_type);
  const skipMarker = entry_type === "ai_research" || entry_type === "system";

  const marker_price = skipMarker ? null : await resolveJournalMarkerPrice(sym);

  let { data, error } = await db
    .from("watchlist_journal_entries")
    .insert({
      user_id: userId,
      symbol: sym,
      body: body.slice(0, 4000),
      entry_type,
      metadata: input.metadata ?? null,
      reply_to_id: input.reply_to_id ?? null,
      conviction_after,
      marker_price,
    } as never)
    .select("id, body, entry_type, metadata, reply_to_id, conviction_after, marker_price, created_at")
    .single();

  if (error && isSchemaDriftError(error)) {
    ({ data, error } = await db
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
      .single());
  }

  if (error) {
    if (isSchemaDriftError(error)) {
      console.warn("[watchlist/journal/entry] journal table unavailable");
      return { error: "journal_unavailable" };
    }
    console.error("[watchlist/journal/entry]", error);
    return { error: "db_error" };
  }

  void db
    .from("user_watchlist")
    .update({ journal_updated_at: new Date().toISOString() } as never)
    .eq("user_id", userId)
    .eq("symbol", sym);

  return { ok: true, entry: mapEntryRow(data as Parameters<typeof mapEntryRow>[0]) };
}

/** Quote at add time for move alerts. */
export async function resolveBaselinePrice(symbol: string): Promise<number | null> {
  const quote = await getQuote(symbol, { fresh: true });
  const price = quote?.c ?? quote?.pc;
  if (price == null || !Number.isFinite(price) || price <= 0) return null;
  return Math.round(price * 10000) / 10000;
}
