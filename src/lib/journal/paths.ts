import type { JournalEntryType } from "@/lib/watchlist/journal-meta";

/** Research journal routes (symbols must be on watchlist). */
export function journalHubPath(): string {
  return "/dashboard/journal";
}

export type JournalSection = "checklist" | "plan" | "entries" | "research" | "chart";

export type JournalPrefillEntry = Extract<
  JournalEntryType,
  | "note"
  | "price_action"
  | "building"
  | "trimming"
  | "exit"
  | "earnings"
  | "news"
  | "thesis_update"
>;

export function journalSymbolPath(
  symbol: string,
  opts?: {
    setup?: boolean;
    section?: JournalSection;
    entry?: JournalPrefillEntry;
    focusEntryId?: string;
  }
): string {
  const sym = symbol.toUpperCase();
  let url = `/dashboard/journal/${encodeURIComponent(sym)}`;
  const params = new URLSearchParams();
  if (opts?.setup) params.set("setup", "1");
  if (opts?.entry) params.set("entry", opts.entry);
  const qs = params.toString();
  if (qs) url += `?${qs}`;
  if (opts?.focusEntryId) {
    url += `#journal-entry-${encodeURIComponent(opts.focusEntryId)}`;
  } else if (opts?.section) {
    url += `#journal-${opts.section}`;
  }
  return url;
}

/** Map watchlist alert kinds to the most relevant journal section. */
export function journalSectionForAlert(
  kind: "price_move" | "plan_level" | "earnings"
): JournalSection {
  switch (kind) {
    case "plan_level":
      return "plan";
    case "earnings":
      return "entries";
    default:
      return "entries";
  }
}

export function journalAlertHref(
  symbol: string,
  kind: "price_move" | "plan_level" | "earnings"
): string {
  return journalSymbolPath(symbol, {
    section: journalSectionForAlert(kind),
    entry:
      kind === "earnings"
        ? "earnings"
        : kind === "price_move"
          ? "price_action"
          : undefined,
  });
}
