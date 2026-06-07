import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { isSchemaDriftError, JOURNAL_FULL_SELECT } from "@/lib/watchlist/db-select";

export type WatchlistRemoveSummary = {
  symbol: string;
  entryCount: number;
  revisionCount: number;
  hasThesis: boolean;
  hasPlanFields: boolean;
  hasResearch: boolean;
};

type ArchiveEntryRow = {
  body: string;
  entry_type?: string;
  metadata?: unknown;
  reply_to_id?: string | null;
  conviction_after?: number | null;
  marker_price?: number | null;
  created_at: string;
  legacy_id?: string;
};

type ArchiveRevisionRow = {
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

function hasPlanContent(journal: Record<string, unknown>): boolean {
  const fields = [
    "entry_price",
    "stop_price",
    "target_price",
    "entry_note",
    "catalysts",
    "risk_factors",
    "bull_case_price",
    "base_case_price",
    "bear_case_price",
  ];
  for (const key of fields) {
    const val = journal[key];
    if (val == null) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    if (typeof val === "string" && !val.trim()) continue;
    return true;
  }
  return false;
}

export async function fetchWatchlistRemoveSummary(
  userId: string,
  symbol: string
): Promise<WatchlistRemoveSummary | null> {
  if (isDemoMode()) {
    return {
      symbol: symbol.toUpperCase(),
      entryCount: 0,
      revisionCount: 0,
      hasThesis: false,
      hasPlanFields: false,
      hasResearch: false,
    };
  }

  const db = createServiceClient();
  const sym = symbol.toUpperCase();

  const { data: row } = await db
    .from("user_watchlist")
    .select("symbol, thesis, entry_price, target_price, catalysts")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (!row) return null;

  const journal = row as Record<string, unknown>;
  const hasThesis = Boolean(String(journal.thesis ?? "").trim());

  const [entriesRes, revisionsRes] = await Promise.all([
    db
      .from("watchlist_journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("symbol", sym),
    db
      .from("watchlist_journal_revisions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("symbol", sym),
  ]);

  const entryCount = entriesRes.count ?? 0;
  const revisionCount = revisionsRes.count ?? 0;
  const hasPlanFields = hasPlanContent(journal);

  return {
    symbol: sym,
    entryCount,
    revisionCount,
    hasThesis,
    hasPlanFields,
    hasResearch: hasThesis || hasPlanFields || entryCount > 0 || revisionCount > 0,
  };
}

async function archiveJournalSnapshot(userId: string, sym: string): Promise<boolean> {
  const db = createServiceClient();

  const { data: watchRow, error: watchErr } = await db
    .from("user_watchlist")
    .select(`${JOURNAL_FULL_SELECT}, price_alert_pct`)
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (watchErr || !watchRow) return false;

  const row = watchRow as Record<string, unknown>;
  const journalPayload: Record<string, unknown> = {};
  for (const key of [
    "thesis",
    "conviction",
    "entry_price",
    "stop_price",
    "target_price",
    "entry_note",
    "journal_updated_at",
    "catalysts",
    "risk_factors",
    "personal_tags",
    "outcome",
    "bull_case_price",
    "base_case_price",
    "bear_case_price",
  ]) {
    if (row[key] !== undefined) journalPayload[key] = row[key];
  }

  const { data: entryRows } = await db
    .from("watchlist_journal_entries")
    .select(
      "id, body, entry_type, metadata, reply_to_id, conviction_after, marker_price, created_at"
    )
    .eq("user_id", userId)
    .eq("symbol", sym)
    .order("created_at", { ascending: true });

  const entries: ArchiveEntryRow[] = (entryRows ?? []).map((e) => {
    const r = e as Record<string, unknown>;
    return {
      legacy_id: String(r.id),
      body: String(r.body),
      entry_type: r.entry_type != null ? String(r.entry_type) : undefined,
      metadata: r.metadata,
      reply_to_id: r.reply_to_id != null ? String(r.reply_to_id) : null,
      conviction_after:
        r.conviction_after != null ? Number(r.conviction_after) : null,
      marker_price: r.marker_price != null ? Number(r.marker_price) : null,
      created_at: String(r.created_at),
    };
  });

  const { data: revisionRows } = await db
    .from("watchlist_journal_revisions")
    .select("field, old_value, new_value, created_at")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .order("created_at", { ascending: true });

  const revisions: ArchiveRevisionRow[] = (revisionRows ?? []).map((r) => {
    const rev = r as Record<string, unknown>;
    return {
      field: String(rev.field),
      old_value: rev.old_value != null ? String(rev.old_value) : null,
      new_value: rev.new_value != null ? String(rev.new_value) : null,
      created_at: String(rev.created_at),
    };
  });

  const hasAnything =
    Object.keys(journalPayload).length > 0 || entries.length > 0 || revisions.length > 0;
  if (!hasAnything) return false;

  const { error: upsertErr } = await db.from("watchlist_journal_archives").upsert(
    {
      user_id: userId,
      symbol: sym,
      asset_class: String(row.asset_class ?? "equity"),
      baseline_price: row.baseline_price != null ? Number(row.baseline_price) : null,
      price_alert_pct: row.price_alert_pct != null ? Number(row.price_alert_pct) : null,
      journal: journalPayload,
      entries,
      revisions,
      archived_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id,symbol" }
  );

  if (upsertErr) {
    if (isSchemaDriftError(upsertErr)) {
      console.warn("[watchlist/archive] archives table unavailable");
      return false;
    }
    console.error("[watchlist/archive/upsert]", upsertErr);
    return false;
  }

  return true;
}

async function deleteWatchlistSymbolData(userId: string, sym: string): Promise<boolean> {
  const db = createServiceClient();

  await db.from("watchlist_journal_entries").delete().eq("user_id", userId).eq("symbol", sym);
  await db
    .from("watchlist_journal_revisions")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", sym);
  await db.from("watchlist_price_band").delete().eq("user_id", userId).eq("symbol", sym);
  await db
    .from("watchlist_alert_sent")
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
    return false;
  }
  return true;
}

export async function archiveAndRemoveFromWatchlist(
  userId: string,
  symbol: string
): Promise<{ ok: true; archived: boolean } | { error: string }> {
  if (isDemoMode()) return { error: "demo_readonly" };

  const sym = symbol.toUpperCase();
  const summary = await fetchWatchlistRemoveSummary(userId, sym);
  const archived = await archiveJournalSnapshot(userId, sym);

  if (summary?.hasResearch && !archived) {
    return { error: "archive_failed" };
  }

  const removed = await deleteWatchlistSymbolData(userId, sym);
  if (!removed) return { error: "db_error" };
  return { ok: true, archived };
}

export async function restoreWatchlistJournalArchive(
  userId: string,
  symbol: string
): Promise<boolean> {
  if (isDemoMode()) return false;

  const db = createServiceClient();
  const sym = symbol.toUpperCase();

  const { data: archive, error } = await db
    .from("watchlist_journal_archives")
    .select("journal, entries, revisions, baseline_price, price_alert_pct, asset_class")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .maybeSingle();

  if (error) {
    if (isSchemaDriftError(error)) return false;
    console.error("[watchlist/archive/restore/fetch]", error);
    return false;
  }
  if (!archive) return false;

  const payload = archive as {
    journal: Record<string, unknown>;
    entries: ArchiveEntryRow[];
    revisions: ArchiveRevisionRow[];
    baseline_price: number | null;
    price_alert_pct: number | null;
    asset_class: string;
  };

  const watchPatch: Record<string, unknown> = {
    ...(payload.journal ?? {}),
  };
  if (payload.baseline_price != null) watchPatch.baseline_price = payload.baseline_price;
  if (payload.price_alert_pct != null) watchPatch.price_alert_pct = payload.price_alert_pct;
  if (payload.asset_class) watchPatch.asset_class = payload.asset_class;

  if (Object.keys(watchPatch).length > 0) {
    const { error: patchErr } = await db
      .from("user_watchlist")
      .update(watchPatch as never)
      .eq("user_id", userId)
      .eq("symbol", sym);
    if (patchErr) {
      console.error("[watchlist/archive/restore/patch]", patchErr);
      return false;
    }
  }

  const entries = payload.entries ?? [];
  const idMap = new Map<string, string>();

  for (const entry of entries) {
    const insertRow: Record<string, unknown> = {
      user_id: userId,
      symbol: sym,
      body: entry.body,
      conviction_after: entry.conviction_after ?? null,
      marker_price: entry.marker_price ?? null,
      created_at: entry.created_at,
    };
    if (entry.entry_type) insertRow.entry_type = entry.entry_type;
    if (entry.metadata != null) insertRow.metadata = entry.metadata;

    const { data: inserted, error: insertErr } = await db
      .from("watchlist_journal_entries")
      .insert(insertRow as never)
      .select("id")
      .single();

    if (insertErr) {
      console.warn("[watchlist/archive/restore/entry]", insertErr);
      continue;
    }
    if (entry.legacy_id && inserted) {
      idMap.set(entry.legacy_id, String((inserted as { id: string }).id));
    }
  }

  for (const entry of entries) {
    if (!entry.legacy_id || !entry.reply_to_id) continue;
    const newId = idMap.get(entry.legacy_id);
    const newReply = idMap.get(entry.reply_to_id);
    if (!newId || !newReply) continue;
    await db
      .from("watchlist_journal_entries")
      .update({ reply_to_id: newReply } as never)
      .eq("id", newId);
  }

  for (const rev of payload.revisions ?? []) {
    await db.from("watchlist_journal_revisions").insert({
      user_id: userId,
      symbol: sym,
      field: rev.field,
      old_value: rev.old_value,
      new_value: rev.new_value,
      created_at: rev.created_at,
    } as never);
  }

  await db
    .from("watchlist_journal_archives")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", sym);

  return true;
}
