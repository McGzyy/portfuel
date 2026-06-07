import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { outcomeLabel } from "@/lib/watchlist/journal-meta";
import type { WatchlistJournal, WatchlistJournalPatch } from "@/lib/watchlist/journal-types";

export type JournalPlanRevision = {
  id: string;
  field: string;
  field_label: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

const FIELD_LABELS: Record<string, string> = {
  thesis: "Thesis",
  conviction: "Conviction",
  entry_price: "Entry price",
  stop_price: "Stop",
  target_price: "Target",
  entry_note: "Entry note",
  catalysts: "Catalysts",
  risk_factors: "Risk factors",
  personal_tags: "Tags",
  outcome: "Outcome",
  bull_case_price: "Bull case",
  base_case_price: "Base case",
  bear_case_price: "Bear case",
};

function fmtPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function fmtText(value: string | null | undefined, max = 280): string {
  const t = value?.trim() ?? "";
  if (!t) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function fmtList(values: string[] | null | undefined): string {
  if (!values?.length) return "—";
  return values.join(", ");
}

function serializeField(
  field: keyof WatchlistJournalPatch,
  journal: WatchlistJournal
): string {
  switch (field) {
    case "thesis":
      return fmtText(journal.thesis);
    case "conviction":
      return journal.conviction != null ? String(journal.conviction) : "—";
    case "entry_price":
      return fmtPrice(journal.entry_price);
    case "stop_price":
      return fmtPrice(journal.stop_price);
    case "target_price":
      return fmtPrice(journal.target_price);
    case "entry_note":
      return fmtText(journal.entry_note, 120);
    case "catalysts":
      return fmtList(journal.catalysts);
    case "risk_factors":
      return fmtText(journal.risk_factors, 160);
    case "personal_tags":
      return fmtList(journal.personal_tags);
    case "outcome":
      return outcomeLabel(journal.outcome);
    case "bull_case_price":
      return fmtPrice(journal.bull_case_price);
    case "base_case_price":
      return fmtPrice(journal.base_case_price);
    case "bear_case_price":
      return fmtPrice(journal.bear_case_price);
    default:
      return "—";
  }
}

function serializePatchValue(
  field: keyof WatchlistJournalPatch,
  patch: WatchlistJournalPatch
): string {
  const j: WatchlistJournal = {
    symbol: "",
    asset_class: "equity",
    created_at: "",
    thesis: patch.thesis,
    conviction: patch.conviction,
    entry_price: patch.entry_price,
    stop_price: patch.stop_price,
    target_price: patch.target_price,
    entry_note: patch.entry_note,
    catalysts: patch.catalysts,
    risk_factors: patch.risk_factors,
    personal_tags: patch.personal_tags,
    outcome: patch.outcome,
    bull_case_price: patch.bull_case_price,
    base_case_price: patch.base_case_price,
    bear_case_price: patch.bear_case_price,
  };
  return serializeField(field, j);
}

const TRACKED_FIELDS: (keyof WatchlistJournalPatch)[] = [
  "thesis",
  "conviction",
  "entry_price",
  "stop_price",
  "target_price",
  "entry_note",
  "catalysts",
  "risk_factors",
  "personal_tags",
  "outcome",
  "bull_case_price",
  "base_case_price",
  "bear_case_price",
];

export function diffJournalPlanRevisions(
  existing: WatchlistJournal,
  patch: WatchlistJournalPatch
): { field: string; old_value: string; new_value: string }[] {
  const rows: { field: string; old_value: string; new_value: string }[] = [];

  for (const field of TRACKED_FIELDS) {
    if (patch[field] === undefined) continue;
    const before = serializeField(field, existing);
    const after = serializePatchValue(field, patch);
    if (before === after) continue;
    rows.push({ field, old_value: before, new_value: after });
  }

  return rows;
}

export async function recordJournalPlanRevisions(
  userId: string,
  symbol: string,
  rows: { field: string; old_value: string; new_value: string }[]
): Promise<void> {
  if (!rows.length || isDemoMode()) return;

  const sym = symbol.toUpperCase().trim();
  const db = createServiceClient();
  const payload = rows.map((row) => ({
    user_id: userId,
    symbol: sym,
    field: row.field,
    old_value: row.old_value,
    new_value: row.new_value,
  }));

  const { error } = await db.from("watchlist_journal_revisions").insert(payload as never);
  if (error) console.error("[watchlist/journal/revisions]", error);
}

export async function fetchJournalPlanRevisions(
  userId: string,
  symbol: string,
  limit = 40
): Promise<JournalPlanRevision[]> {
  if (isDemoMode()) return [];

  const sym = symbol.toUpperCase().trim();
  const db = createServiceClient();
  const { data, error } = await db
    .from("watchlist_journal_revisions")
    .select("id, field, old_value, new_value, created_at")
    .eq("user_id", userId)
    .eq("symbol", sym)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    field: row.field as string,
    field_label: FIELD_LABELS[row.field as string] ?? (row.field as string),
    old_value: (row.old_value as string | null) ?? null,
    new_value: (row.new_value as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}

/** Group revisions saved in the same second (one Save click). */
export function groupJournalRevisions(
  revisions: JournalPlanRevision[]
): { created_at: string; items: JournalPlanRevision[] }[] {
  const groups: { created_at: string; items: JournalPlanRevision[] }[] = [];

  for (const rev of revisions) {
    const bucket = rev.created_at.slice(0, 19);
    const last = groups[groups.length - 1];
    if (last && last.created_at.slice(0, 19) === bucket) {
      last.items.push(rev);
    } else {
      groups.push({ created_at: rev.created_at, items: [rev] });
    }
  }

  return groups;
}
