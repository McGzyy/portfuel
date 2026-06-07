import {
  journalEntryTypeLabel,
  outcomeLabel,
} from "@/lib/watchlist/journal-meta";
import { fetchJournalEntries, fetchWatchlistJournal } from "@/lib/watchlist/journal";
import type { WatchlistJournal, WatchlistJournalEntry } from "@/lib/watchlist/journal-types";
import { fetchWatchlist } from "@/lib/watchlist/service";

function exportDateLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value >= 1000 ? `$${value.toLocaleString()}` : `$${value}`;
}

function line(label: string, value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  return `- **${label}:** ${v}`;
}

function section(title: string, body: string[]): string[] {
  if (body.length === 0) return [];
  return [`## ${title}`, "", ...body, ""];
}

export function journalSymbolToMarkdown(
  journal: WatchlistJournal,
  entries: WatchlistJournalEntry[]
): string {
  const lines: string[] = [
    `# ${journal.symbol} — Research Journal`,
    "",
    `*Exported from PortFuel · ${exportDateLabel()}*`,
    "",
  ];

  if (journal.thesis?.trim()) {
    lines.push(...section("Thesis", [journal.thesis.trim()]));
  }

  const overview = [
    journal.conviction != null ? `- **Conviction:** ${journal.conviction}/10` : null,
    journal.outcome ? `- **Outcome:** ${outcomeLabel(journal.outcome)}` : null,
    journal.last_price != null
      ? `- **Last price (export):** ${formatPrice(journal.last_price)}`
      : null,
    journal.journal_updated_at
      ? `- **Last updated:** ${formatTimestamp(journal.journal_updated_at)}`
      : null,
  ].filter((l): l is string => l != null);

  if (overview.length > 0) {
    lines.push(...section("Overview", overview));
  }

  const plan = [
    line("Entry", formatPrice(journal.entry_price)),
    line("Stop", formatPrice(journal.stop_price)),
    line("Target", formatPrice(journal.target_price)),
    line("Entry note", journal.entry_note),
    line("Bull case", formatPrice(journal.bull_case_price)),
    line("Base case", formatPrice(journal.base_case_price)),
    line("Bear case", formatPrice(journal.bear_case_price)),
  ].filter((l): l is string => l != null);

  if (plan.length > 0) {
    lines.push(...section("Plan", plan));
  }

  if (journal.catalysts?.length) {
    lines.push(
      ...section("Catalysts", [`- ${journal.catalysts.join(", ")}`])
    );
  }

  if (journal.risk_factors?.trim()) {
    lines.push(...section("Risk factors", [journal.risk_factors.trim()]));
  }

  if (journal.personal_tags?.length) {
    lines.push(...section("Tags", [`- ${journal.personal_tags.join(", ")}`]));
  }

  const timeline = entries.filter((e) => e.body.trim());
  if (timeline.length > 0) {
    lines.push("## Timeline", "");
    for (const entry of timeline) {
      const type = journalEntryTypeLabel(entry.entry_type);
      lines.push(`### ${formatTimestamp(entry.created_at)} · ${type}`);
      if (entry.conviction_after != null) {
        lines.push(`*Conviction after entry: ${entry.conviction_after}/10*`, "");
      }
      if (entry.marker_price != null && entry.marker_price > 0) {
        lines.push(`*Chart marker @ ${formatPrice(entry.marker_price)}*`, "");
      }
      lines.push(entry.body.trim(), "");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

function hasExportableJournal(
  journal: WatchlistJournal,
  entries: WatchlistJournalEntry[]
): boolean {
  return Boolean(
    journal.thesis?.trim() ||
      journal.entry_price != null ||
      journal.target_price != null ||
      journal.risk_factors?.trim() ||
      entries.length > 0
  );
}

export async function buildSymbolJournalExport(
  userId: string,
  symbol: string
): Promise<string | null> {
  const journal = await fetchWatchlistJournal(userId, symbol);
  if (!journal) return null;
  const entries = await fetchJournalEntries(userId, symbol);
  return journalSymbolToMarkdown(journal, entries);
}

export async function buildHubJournalExport(userId: string): Promise<string> {
  const watchlist = await fetchWatchlist(userId);
  const sections: string[] = [
    "# PortFuel Research Notebook",
    "",
    `*Exported from PortFuel · ${exportDateLabel()}*`,
    "",
    `Private research for ${watchlist.length} watchlist symbol${watchlist.length === 1 ? "" : "s"}.`,
    "",
  ];

  let exported = 0;

  for (const item of watchlist) {
    const journal = await fetchWatchlistJournal(userId, item.symbol);
    if (!journal) continue;
    const entries = await fetchJournalEntries(userId, item.symbol);
    if (!hasExportableJournal(journal, entries)) continue;

    if (exported > 0) {
      sections.push("---", "");
    }
    sections.push(journalSymbolToMarkdown(journal, entries));
    exported++;
  }

  if (exported === 0) {
    sections.push(
      "_No journal content yet. Add a thesis or log an entry on a watchlist symbol._",
      ""
    );
  }

  return sections.join("\n").trimEnd() + "\n";
}
