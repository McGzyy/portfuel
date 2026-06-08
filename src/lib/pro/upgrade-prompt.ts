/** Watchlist-aware copy for Pro upgrade surfaces. */

export function formatSymbolSample(symbols: string[], max = 3): string | null {
  if (symbols.length === 0) return null;
  const head = symbols.slice(0, max).join(", ");
  if (symbols.length <= max) return head;
  return `${head} +${symbols.length - max} more`;
}

export function buildComparePreviewLabel(symbols: string[]): string | null {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  if (unique.length < 2) return null;
  return `${unique[0]} vs ${unique[1]}${unique.length > 2 ? ` (+${unique.length - 2})` : ""}`;
}

export function watchlistReportingSymbols(
  watchlistSymbols: string[],
  reportingSymbols: string[]
): string[] {
  const watch = new Set(watchlistSymbols.map((s) => s.toUpperCase()));
  return reportingSymbols.filter((s) => watch.has(s.toUpperCase()));
}

export function buildProOverviewGateDescription(watchlistSymbols: string[]): string {
  const compare = buildComparePreviewLabel(watchlistSymbols);
  if (compare) {
    return `Line up ${compare}, track earnings on names you follow, and scan community movers — included with Pro Intelligence.`;
  }
  if (watchlistSymbols.length === 1) {
    return `Add one more watchlist name to compare side-by-side, plus earnings and screener depth on Pro Intelligence.`;
  }
  return "Live earnings positioning, screener movers, and crypto leaders on your overview — included with Pro Intelligence.";
}

export function buildProMembershipHook(watchlistSymbols: string[]): string | null {
  const compare = buildComparePreviewLabel(watchlistSymbols);
  if (compare) {
    return `Compare ${compare}, run the screener on community movers, and unlock full ticker intel.`;
  }
  if (watchlistSymbols.length === 1) {
    return `Your watchlist is seeded — Pro adds compare, earnings week, and full research on every name.`;
  }
  return null;
}

export function buildEarningsGateDescription(
  watchlistSymbols: string[],
  reportingSymbols: string[]
): string {
  const overlap = watchlistReportingSymbols(watchlistSymbols, reportingSymbols);
  if (overlap.length > 0) {
    const sample = formatSymbolSample(overlap, 2);
    return `${overlap.length} watchlist name${overlap.length === 1 ? "" : "s"} report in the next two weeks${sample ? ` (${sample})` : ""} — see community lean and desk positioning on Pro.`;
  }
  return "Market-wide reporting week plus how PortFuel members and the Fueled desk are positioned before each report.";
}

export function buildScreenerGateDescription(
  watchlistSymbols: string[],
  screenerHits: string[]
): string {
  if (screenerHits.length > 0) {
    return `${formatSymbolSample(screenerHits, 3) ?? screenerHits.join(", ")} ${screenerHits.length === 1 ? "is" : "are"} on your watchlist and in this week's community screener — unlock full tables on Pro.`;
  }
  return "See what the desk is calling most and which theses are winning — Pro Intelligence.";
}

export function watchlistScreenerHits(
  watchlistSymbols: string[],
  rows: { symbol: string }[][]
): string[] {
  const watch = new Set(watchlistSymbols.map((s) => s.toUpperCase()));
  const hits: string[] = [];
  for (const group of rows) {
    for (const row of group) {
      const sym = row.symbol.toUpperCase();
      if (watch.has(sym) && !hits.includes(row.symbol)) {
        hits.push(row.symbol);
      }
    }
  }
  return hits.slice(0, 4);
}
