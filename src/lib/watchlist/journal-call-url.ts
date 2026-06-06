import { COPY } from "@/lib/copy";
import { normalizeCatalysts } from "@/lib/watchlist/journal-meta";
import type { WatchlistJournal } from "@/lib/watchlist/journal-types";
import type { WatchlistEntry } from "@/lib/watchlist/types";

export function buildPublishUrlFromJournal(journal: WatchlistJournal): string {
  const params = new URLSearchParams();
  params.set("from", "journal");
  params.set("asset", journal.asset_class);
  params.set("symbol", journal.symbol);

  if (journal.thesis?.trim()) {
    params.set("thesis", journal.thesis.trim().slice(0, 2000));
  }
  if (journal.entry_price != null && journal.entry_price > 0) {
    params.set("entry", String(journal.entry_price));
  }
  const target =
    journal.target_price ??
    (journal.base_case_price != null && journal.base_case_price > 0
      ? journal.base_case_price
      : null);
  if (target != null && target > 0) {
    params.set("target", String(target));
  }
  if (journal.stop_price != null && journal.stop_price > 0) {
    params.set("stop", String(journal.stop_price));
  }
  const notes = buildJournalPublishContextNotes(journal);
  if (notes) params.set("notes", notes);

  if (journal.conviction != null) {
    params.set("conviction", String(journal.conviction));
  }
  if (journal.catalysts?.length) {
    params.set("catalysts", journal.catalysts.join(","));
  }

  return `${COPY.newCallHref}?${params.toString()}`;
}

function buildJournalPublishContextNotes(journal: WatchlistJournal): string | undefined {
  const notes: string[] = [];
  if (journal.catalysts?.length) {
    notes.push(`Catalysts: ${journal.catalysts.join(", ")}`);
  }
  if (journal.risk_factors?.trim()) {
    notes.push(`Risks: ${journal.risk_factors.trim()}`);
  }
  if (journal.entry_note?.trim()) {
    notes.push(`Entry plan: ${journal.entry_note.trim()}`);
  }
  if (journal.conviction != null) notes.push(`Journal conviction: ${journal.conviction}/10`);
  if (journal.bull_case_price != null) notes.push(`Bull case: $${journal.bull_case_price}`);
  if (journal.base_case_price != null) notes.push(`Base case: $${journal.base_case_price}`);
  if (journal.bear_case_price != null) notes.push(`Bear case: $${journal.bear_case_price}`);
  if (notes.length === 0) return undefined;
  return notes.join("\n").slice(0, 1500);
}

/** Publish URL from journal hub row (partial journal fields on watchlist). */
export function buildPublishUrlFromHubEntry(entry: WatchlistEntry): string {
  return buildPublishUrlFromJournal({
    symbol: entry.symbol,
    asset_class: entry.asset_class,
    created_at: entry.created_at,
    thesis: entry.thesis ?? null,
    conviction: entry.conviction ?? null,
    entry_price: entry.entry_price ?? null,
    target_price: entry.target_price ?? null,
    risk_factors: entry.risk_factors ?? null,
    catalysts: normalizeCatalysts(entry.catalysts),
  });
}
