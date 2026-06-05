import { COPY } from "@/lib/copy";
import type { WatchlistJournal } from "@/lib/watchlist/journal-types";

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
  if (journal.entry_note?.trim()) {
    const notes = [`Entry plan: ${journal.entry_note.trim()}`];
    if (journal.conviction != null) notes.push(`Journal conviction: ${journal.conviction}/10`);
    if (journal.bull_case_price != null) notes.push(`Bull case: $${journal.bull_case_price}`);
    if (journal.base_case_price != null) notes.push(`Base case: $${journal.base_case_price}`);
    if (journal.bear_case_price != null) notes.push(`Bear case: $${journal.bear_case_price}`);
    params.set("notes", notes.join("\n").slice(0, 1500));
  } else {
    const notes: string[] = [];
    if (journal.conviction != null) notes.push(`Journal conviction: ${journal.conviction}/10`);
    if (journal.bull_case_price != null) notes.push(`Bull case: $${journal.bull_case_price}`);
    if (journal.base_case_price != null) notes.push(`Base case: $${journal.base_case_price}`);
    if (journal.bear_case_price != null) notes.push(`Bear case: $${journal.bear_case_price}`);
    if (notes.length > 0) params.set("notes", notes.join("\n").slice(0, 1500));
  }

  return `${COPY.newCallHref}?${params.toString()}`;
}
