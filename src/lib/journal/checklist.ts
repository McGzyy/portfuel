import type { WatchlistJournal, WatchlistJournalEntry } from "@/lib/watchlist/journal-types";

export type JournalChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  hint: string;
  optional?: boolean;
};

export type JournalResearchChecklist = {
  items: JournalChecklistItem[];
  completed: number;
  total: number;
  requiredCompleted: number;
  requiredTotal: number;
  readyToPublish: boolean;
};

const MANUAL_TYPES = new Set([
  "note",
  "price_action",
  "earnings",
  "news",
  "thesis_update",
]);

export function buildJournalResearchChecklist(
  journal: WatchlistJournal,
  entries: WatchlistJournalEntry[]
): JournalResearchChecklist {
  const hasThesis = Boolean(journal.thesis?.trim());
  const hasCatalystsOrRisks =
    (journal.catalysts?.length ?? 0) > 0 || Boolean(journal.risk_factors?.trim());
  const hasPlan =
    journal.entry_price != null &&
    journal.entry_price > 0 &&
    journal.target_price != null &&
    journal.target_price > 0;
  const manualEntries = entries.filter((e) => MANUAL_TYPES.has(e.entry_type)).length;
  const hasAiResearch = entries.some((e) => e.entry_type === "ai_research");

  const items: JournalChecklistItem[] = [
    {
      id: "thesis",
      label: "Thesis drafted",
      done: hasThesis,
      hint: "Why you're watching this symbol",
    },
    {
      id: "catalysts",
      label: "Catalysts or risks",
      done: hasCatalystsOrRisks,
      hint: "What could move the name",
    },
    {
      id: "plan",
      label: "Entry & target set",
      done: hasPlan,
      hint: "Plan levels on your chart",
    },
    {
      id: "entries",
      label: "2+ logged updates",
      done: manualEntries >= 2,
      hint: `${manualEntries}/2 notes, earnings, or price action`,
    },
    {
      id: "ai_research",
      label: "AI research saved",
      done: hasAiResearch,
      hint: "Run review — auto-saves to timeline",
      optional: true,
    },
  ];

  const required = items.filter((i) => !i.optional);
  const requiredCompleted = required.filter((i) => i.done).length;

  return {
    items,
    completed: items.filter((i) => i.done).length,
    total: items.length,
    requiredCompleted,
    requiredTotal: required.length,
    readyToPublish: requiredCompleted === required.length,
  };
}
