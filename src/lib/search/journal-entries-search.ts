import { journalSymbolPath } from "@/lib/journal/paths";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { snippetAroundMatch } from "@/lib/search/highlight";
import type { SearchJournalEntryResult } from "@/lib/search/types";
import { isSchemaDriftError } from "@/lib/watchlist/db-select";
import { getDemoJournalEntries, isDemoJournalSymbol } from "@/lib/watchlist/journal-demo";
import { getDemoWatchlistSeed } from "@/lib/watchlist/demo";
import { journalEntryTypeLabel } from "@/lib/watchlist/journal-meta";

const JOURNAL_LIMIT = 5;
const MIN_QUERY_LEN = 2;

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function mapRow(
  row: {
    id: string;
    symbol: string;
    body: string;
    entry_type: string;
    created_at: string;
  },
  query: string
): SearchJournalEntryResult {
  const body = row.body.trim();
  return {
    id: row.id,
    symbol: row.symbol.toUpperCase(),
    body: snippetAroundMatch(body, query),
    entryType: row.entry_type,
    entryTypeLabel: journalEntryTypeLabel(row.entry_type),
    createdAt: row.created_at,
    href: journalSymbolPath(row.symbol, { section: "entries", focusEntryId: row.id }),
  };
}

function searchDemoJournalEntries(query: string): SearchJournalEntryResult[] {
  const q = query.trim().toLowerCase();
  const symbols = getDemoWatchlistSeed().map((row) => row.symbol);
  const matches: SearchJournalEntryResult[] = [];

  for (const sym of symbols) {
    if (!isDemoJournalSymbol(sym)) continue;
    for (const entry of getDemoJournalEntries(sym)) {
      if (entry.entry_type === "system") continue;
      if (!entry.body.toLowerCase().includes(q)) continue;
      matches.push(
        mapRow(
          {
            id: entry.id,
            symbol: sym,
            body: entry.body,
            entry_type: entry.entry_type,
            created_at: entry.created_at,
          },
          query
        )
      );
    }
  }

  return matches
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, JOURNAL_LIMIT);
}

export async function searchJournalEntries(
  userId: string,
  query: string
): Promise<SearchJournalEntryResult[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY_LEN) return [];

  if (isDemoMode()) return searchDemoJournalEntries(q);

  const db = createServiceClient();
  const pattern = `%${escapeIlike(q)}%`;
  const { data, error } = await db
    .from("watchlist_journal_entries")
    .select("id, symbol, body, entry_type, created_at")
    .eq("user_id", userId)
    .neq("entry_type", "system")
    .ilike("body", pattern)
    .order("created_at", { ascending: false })
    .limit(JOURNAL_LIMIT);

  if (error) {
    if (isSchemaDriftError(error)) {
      console.warn("[search/journal] journal entries table unavailable");
      return [];
    }
    console.error("[search/journal]", error);
    return [];
  }

  return (data ?? []).map((row) =>
    mapRow(
      row as {
        id: string;
        symbol: string;
        body: string;
        entry_type: string;
        created_at: string;
      },
      q
    )
  );
}
