import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  normalizeCatalysts,
  outcomeLabel,
  type JournalCatalyst,
  type JournalOutcome,
} from "@/lib/watchlist/journal-meta";

export type JournalReviewRow = {
  symbol: string;
  conviction: number | null;
  outcome: JournalOutcome;
  outcome_label: string;
  thesis: string | null;
  catalysts: JournalCatalyst[];
  baseline_price: number | null;
  last_price: number | null;
  change_since_add_pct: number | null;
  entry_price: number | null;
  target_price: number | null;
  journal_updated_at: string | null;
  /** 0–100 toward target from entry (long assumption); null if levels missing */
  target_progress_pct: number | null;
};

export type JournalReviewStats = {
  total: number;
  active: number;
  with_thesis: number;
  closed_correct: number;
  closed_incorrect: number;
  closed_early: number;
  invalidated: number;
  /** closed_correct / (closed_correct + closed_incorrect), null if none */
  journal_win_rate_pct: number | null;
  avg_conviction_correct: number | null;
  avg_conviction_incorrect: number | null;
};

export type JournalReviewSnapshot = {
  stats: JournalReviewStats;
  broken: JournalReviewRow[];
  /** Active ideas with entry+target for progress tracking */
  tracking: JournalReviewRow[];
};

const ACTIVE: JournalOutcome[] = ["watching", "developing"];
const BROKEN: JournalOutcome[] = ["invalidated", "closed_incorrect"];

function targetProgress(
  entry: number | null,
  target: number | null,
  last: number | null
): number | null {
  if (entry == null || target == null || last == null) return null;
  if (entry <= 0 || target <= 0 || last <= 0) return null;
  const span = target - entry;
  if (Math.abs(span) < 0.0001) return null;
  const raw = ((last - entry) / span) * 100;
  return Math.round(Math.max(-999, Math.min(999, raw)) * 10) / 10;
}

function mapRow(
  row: {
    symbol: string;
    conviction: number | null;
    outcome: string | null;
    thesis: string | null;
    catalysts: string[] | null;
    baseline_price: number | null;
    entry_price: number | null;
    target_price: number | null;
    journal_updated_at: string | null;
  },
  lastPrice: number | null
): JournalReviewRow {
  const baseline =
    row.baseline_price != null ? Number(row.baseline_price) : null;
  let change_since_add_pct: number | null = null;
  if (baseline != null && baseline > 0 && lastPrice != null) {
    change_since_add_pct = ((lastPrice - baseline) / baseline) * 100;
  }

  const outcome = (row.outcome ?? "watching") as JournalOutcome;
  const entry = row.entry_price != null ? Number(row.entry_price) : null;
  const target = row.target_price != null ? Number(row.target_price) : null;

  return {
    symbol: row.symbol,
    conviction: row.conviction != null ? Number(row.conviction) : null,
    outcome,
    outcome_label: outcomeLabel(outcome),
    thesis: row.thesis,
    catalysts: normalizeCatalysts(row.catalysts),
    baseline_price: baseline,
    last_price: lastPrice,
    change_since_add_pct,
    entry_price: entry,
    target_price: target,
    journal_updated_at: row.journal_updated_at,
    target_progress_pct: targetProgress(entry, target, lastPrice),
  };
}

export async function fetchJournalReview(userId: string): Promise<JournalReviewSnapshot> {
  const empty: JournalReviewSnapshot = {
    stats: {
      total: 0,
      active: 0,
      with_thesis: 0,
      closed_correct: 0,
      closed_incorrect: 0,
      closed_early: 0,
      invalidated: 0,
      journal_win_rate_pct: null,
      avg_conviction_correct: null,
      avg_conviction_incorrect: null,
    },
    broken: [],
    tracking: [],
  };

  if (isDemoMode()) return empty;

  const db = createServiceClient();
  const { data, error } = await db
    .from("user_watchlist")
    .select(
      "symbol, conviction, outcome, thesis, catalysts, baseline_price, entry_price, target_price, journal_updated_at"
    )
    .eq("user_id", userId);

  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return empty;

  const symbols = rows.map((r) => (r as { symbol: string }).symbol);
  const { data: snaps } = await db
    .from("ticker_snapshots")
    .select("symbol, last_price")
    .in("symbol", symbols);

  const priceMap = new Map(
    (snaps ?? []).map((s) => [
      s.symbol as string,
      s.last_price != null ? Number(s.last_price) : null,
    ])
  );

  const mapped = rows.map((r) =>
    mapRow(
      r as {
        symbol: string;
        conviction: number | null;
        outcome: string | null;
        thesis: string | null;
        catalysts: string[] | null;
        baseline_price: number | null;
        entry_price: number | null;
        target_price: number | null;
        journal_updated_at: string | null;
      },
      priceMap.get((r as { symbol: string }).symbol) ?? null
    )
  );

  let closed_correct = 0;
  let closed_incorrect = 0;
  let closed_early = 0;
  let invalidated = 0;
  let active = 0;
  let with_thesis = 0;
  const convCorrect: number[] = [];
  const convIncorrect: number[] = [];

  for (const row of mapped) {
    if (row.thesis?.trim()) with_thesis++;
    if (ACTIVE.includes(row.outcome)) active++;
    switch (row.outcome) {
      case "closed_correct":
        closed_correct++;
        if (row.conviction != null) convCorrect.push(row.conviction);
        break;
      case "closed_incorrect":
        closed_incorrect++;
        if (row.conviction != null) convIncorrect.push(row.conviction);
        break;
      case "closed_early":
        closed_early++;
        break;
      case "invalidated":
        invalidated++;
        break;
      default:
        break;
    }
  }

  const decided = closed_correct + closed_incorrect;
  const journal_win_rate_pct =
    decided > 0 ? Math.round((closed_correct / decided) * 1000) / 10 : null;

  const avg = (nums: number[]) =>
    nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;

  const broken = mapped
    .filter((r) => BROKEN.includes(r.outcome))
    .sort((a, b) => (b.journal_updated_at ?? "").localeCompare(a.journal_updated_at ?? ""));

  const tracking = mapped
    .filter(
      (r) =>
        ACTIVE.includes(r.outcome) &&
        r.entry_price != null &&
        r.target_price != null &&
        r.target_progress_pct != null
    )
    .sort((a, b) => (b.target_progress_pct ?? 0) - (a.target_progress_pct ?? 0))
    .slice(0, 6);

  return {
    stats: {
      total: mapped.length,
      active,
      with_thesis,
      closed_correct,
      closed_incorrect,
      closed_early,
      invalidated,
      journal_win_rate_pct,
      avg_conviction_correct: avg(convCorrect),
      avg_conviction_incorrect: avg(convIncorrect),
    },
    broken,
    tracking,
  };
}
