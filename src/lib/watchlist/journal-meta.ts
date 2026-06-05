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
