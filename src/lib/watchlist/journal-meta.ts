export const JOURNAL_CATALYST_OPTIONS = [
  "Earnings",
  "Product launch",
  "FDA approval",
  "Fed decision",
  "Acquisition",
  "Partnership",
  "AI exposure",
  "Crypto exposure",
  "Regulatory change",
] as const;

export type JournalCatalyst = (typeof JOURNAL_CATALYST_OPTIONS)[number];

export const JOURNAL_OUTCOMES = [
  { value: "watching", label: "Watching" },
  { value: "developing", label: "Still developing" },
  { value: "invalidated", label: "Thesis invalidated" },
  { value: "closed_correct", label: "Closed — thesis correct" },
  { value: "closed_incorrect", label: "Closed — thesis incorrect" },
  { value: "closed_early", label: "Closed — too early" },
] as const;

export type JournalOutcome = (typeof JOURNAL_OUTCOMES)[number]["value"];

const MAX_TAGS = 12;
const MAX_TAG_LEN = 24;

export function normalizePersonalTags(raw: string[] | null | undefined): string[] {
  if (!raw?.length) return [];
  const out: string[] = [];
  for (const t of raw) {
    const tag = t.trim().slice(0, MAX_TAG_LEN);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (out.some((x) => x.toLowerCase() === key)) continue;
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export function parseTagsInput(input: string): string[] {
  return normalizePersonalTags(input.split(/[,]+/).map((s) => s.trim()));
}

export function normalizeCatalysts(raw: string[] | null | undefined): JournalCatalyst[] {
  if (!raw?.length) return [];
  const allowed = new Set<string>(JOURNAL_CATALYST_OPTIONS);
  return raw.filter((c): c is JournalCatalyst => allowed.has(c));
}

export function outcomeLabel(outcome: JournalOutcome | string | null | undefined): string {
  const row = JOURNAL_OUTCOMES.find((o) => o.value === outcome);
  return row?.label ?? "Watching";
}

export const JOURNAL_ENTRY_TYPES = [
  { value: "note", label: "General note" },
  { value: "price_action", label: "Price action" },
  { value: "earnings", label: "Earnings" },
  { value: "news", label: "News / filing" },
  { value: "thesis_update", label: "Thesis update" },
] as const;

export type JournalEntryType =
  | (typeof JOURNAL_ENTRY_TYPES)[number]["value"]
  | "ai_research"
  | "system";

const USER_ENTRY_TYPES = new Set<string>(JOURNAL_ENTRY_TYPES.map((t) => t.value));

export function normalizeJournalEntryType(raw: string | null | undefined): JournalEntryType {
  if (raw === "ai_research" || raw === "system") return raw;
  if (raw && USER_ENTRY_TYPES.has(raw)) return raw as (typeof JOURNAL_ENTRY_TYPES)[number]["value"];
  return "note";
}

export function journalEntryTypeLabel(type: JournalEntryType | string | null | undefined): string {
  if (type === "ai_research") return "AI research";
  if (type === "system") return "System";
  const row = JOURNAL_ENTRY_TYPES.find((t) => t.value === type);
  return row?.label ?? "Note";
}

export const JOURNAL_ENTRY_PLACEHOLDERS: Partial<
  Record<(typeof JOURNAL_ENTRY_TYPES)[number]["value"], string>
> = {
  note: "What changed your view — catalyst, risk, or conviction shift…",
  price_action: "Price moved to $X — volume spike, broke support/resistance…",
  earnings: "Earnings reported — revenue, guidance, margins, and what changed your view…",
  news: "Headline or filing — what it means for your thesis…",
  thesis_update: "Thesis update — what you got right/wrong and what you're watching next…",
};

export type JournalScenarioProgress = {
  bull: number | null;
  base: number | null;
  bear: number | null;
};

/** % distance from current price to each scenario target (positive = below target for long thesis). */
export function scenarioProgress(
  current: number | null | undefined,
  journal: {
    bull_case_price?: number | null;
    base_case_price?: number | null;
    bear_case_price?: number | null;
  }
): JournalScenarioProgress {
  if (current == null || current <= 0) {
    return { bull: null, base: null, bear: null };
  }
  const pctTo = (target: number | null | undefined) => {
    if (target == null || target <= 0) return null;
    return Math.round(((target - current) / current) * 1000) / 10;
  };
  return {
    bull: pctTo(journal.bull_case_price),
    base: pctTo(journal.base_case_price),
    bear: pctTo(journal.bear_case_price),
  };
}
