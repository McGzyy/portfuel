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
  if (journal.target_price != null && journal.target_price > 0) {
    params.set("target", String(journal.target_price));
  }
  if (journal.stop_price != null && journal.stop_price > 0) {
    params.set("stop", String(journal.stop_price));
  }
  if (journal.entry_note?.trim()) {
    const notes = [`Entry plan: ${journal.entry_note.trim()}`];
    if (journal.conviction != null) {
      notes.push(`Journal conviction: ${journal.conviction}/10`);
    }
    params.set("notes", notes.join("\n").slice(0, 1500));
  } else if (journal.conviction != null) {
    params.set("notes", `Journal conviction: ${journal.conviction}/10`.slice(0, 1500));
  }

  return `${COPY.newCallHref}?${params.toString()}`;
}
