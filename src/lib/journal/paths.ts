/** Research journal routes (symbols must be on watchlist). */
export function journalHubPath(): string {
  return "/dashboard/journal";
}

export type JournalSection = "checklist" | "plan" | "entries" | "research" | "chart";

export function journalSymbolPath(
  symbol: string,
  opts?: { setup?: boolean; section?: JournalSection }
): string {
  const sym = symbol.toUpperCase();
  let url = `/dashboard/journal/${encodeURIComponent(sym)}`;
  if (opts?.setup) url += "?setup=1";
  if (opts?.section) url += `#journal-${opts.section}`;
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
  return journalSymbolPath(symbol, { section: journalSectionForAlert(kind) });
}
