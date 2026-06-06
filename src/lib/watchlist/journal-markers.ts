import type { ChartMarker } from "@/lib/charts/types";
import type { WatchlistJournalEntry } from "@/lib/watchlist/journal-types";

const JOURNAL_MARKER_COLOR = "#6366f1";

function dayStartUnix(iso: string): number {
  const ts = Math.floor(new Date(iso).getTime() / 1000);
  return Math.floor(ts / 86400) * 86400;
}

function markerLabel(body: string): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  const short = oneLine.length > 36 ? `${oneLine.slice(0, 36)}…` : oneLine;
  return `Journal · ${short}`;
}

export function buildJournalEntryMarkers(entries: WatchlistJournalEntry[]): ChartMarker[] {
  return entries
    .filter(
      (e) =>
        e.marker_price != null &&
        e.marker_price > 0 &&
        e.entry_type !== "ai_research" &&
        e.entry_type !== "system"
    )
    .map((e) => ({
      time: dayStartUnix(e.created_at),
      price: e.marker_price!,
      label: markerLabel(e.body),
      color: JOURNAL_MARKER_COLOR,
      kind: "journal" as const,
      journalEntryId: e.id,
    }));
}
