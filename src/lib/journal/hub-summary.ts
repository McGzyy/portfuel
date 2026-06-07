import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { summarizeJournalHubProgress } from "@/lib/journal/checklist";
import { getDemoJournalEntryStats } from "@/lib/watchlist/journal-demo";
import type { WatchlistEntry } from "@/lib/watchlist/types";

export type JournalEntryStats = {
  manualCount: number;
  hasAiResearch: boolean;
};

const MANUAL_TYPES = new Set([
  "note",
  "price_action",
  "earnings",
  "news",
  "thesis_update",
]);

export async function fetchJournalEntryStats(
  userId: string
): Promise<Record<string, JournalEntryStats>> {
  if (isDemoMode()) return getDemoJournalEntryStats();

  const db = createServiceClient();
  const { data, error } = await db
    .from("watchlist_journal_entries")
    .select("symbol, entry_type")
    .eq("user_id", userId);

  if (error) {
    console.error("[watchlist/journal/stats]", error);
    return {};
  }

  const map: Record<string, JournalEntryStats> = {};
  for (const row of data ?? []) {
    const sym = (row as { symbol: string; entry_type: string }).symbol;
    const type = (row as { symbol: string; entry_type: string }).entry_type ?? "note";
    if (!map[sym]) map[sym] = { manualCount: 0, hasAiResearch: false };
    if (MANUAL_TYPES.has(type)) map[sym].manualCount += 1;
    if (type === "ai_research") map[sym].hasAiResearch = true;
  }
  return map;
}

/** Sort hub rows with the least complete research first. */
export function compareJournalHubIncomplete(a: WatchlistEntry, b: WatchlistEntry): number {
  const pa = a.journal_progress?.required_completed ?? 0;
  const pb = b.journal_progress?.required_completed ?? 0;
  if (pa !== pb) return pa - pb;
  if (Boolean(a.has_thesis) !== Boolean(b.has_thesis)) {
    return a.has_thesis ? 1 : -1;
  }
  return a.symbol.localeCompare(b.symbol);
}

export function attachJournalHubProgress(
  items: WatchlistEntry[],
  statsBySymbol: Record<string, JournalEntryStats>
): WatchlistEntry[] {
  return items.map((item) => {
    const stats = statsBySymbol[item.symbol] ?? { manualCount: 0, hasAiResearch: false };
    const row = item as WatchlistEntry & {
      thesis?: string | null;
      risk_factors?: string | null;
      entry_price?: number | null;
      target_price?: number | null;
    };
    const progress = summarizeJournalHubProgress(
      {
        thesis: row.thesis ?? null,
        catalysts: item.catalysts,
        risk_factors: row.risk_factors ?? null,
        entry_price: row.entry_price ?? null,
        target_price: row.target_price ?? null,
      },
      stats
    );
    return { ...item, journal_progress: progress };
  });
}
