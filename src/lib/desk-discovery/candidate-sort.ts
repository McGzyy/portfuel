import type { DiscoveryCandidateRow, DiscoveryReason } from "@/lib/desk-discovery/types";

export type DiscoverySortMode = "score" | "earnings" | "symbol";

/** Parse "Earnings in 2d on …" from discovery reasons. */
export function parseEarningsDays(reasons: DiscoveryReason[]): number | null {
  const row = reasons.find((r) => r.type === "earnings_soon");
  if (!row) return null;
  const match = row.detail.match(/Earnings in (\d+)d/i);
  if (!match) return null;
  const days = Number.parseInt(match[1]!, 10);
  return Number.isFinite(days) ? days : null;
}

export function earningsLabel(reasons: DiscoveryReason[]): string | null {
  const row = reasons.find((r) => r.type === "earnings_soon");
  return row?.detail ?? null;
}

export function sortDiscoveryCandidates(
  rows: DiscoveryCandidateRow[],
  mode: DiscoverySortMode
): DiscoveryCandidateRow[] {
  const copy = [...rows];

  if (mode === "symbol") {
    return copy.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  if (mode === "earnings") {
    return copy.sort((a, b) => {
      const daysA = parseEarningsDays(a.reasons) ?? 999;
      const daysB = parseEarningsDays(b.reasons) ?? 999;
      if (daysA !== daysB) return daysA - daysB;
      return b.score - a.score || a.symbol.localeCompare(b.symbol);
    });
  }

  return copy.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));
}

export type DiscoveryArchiveSortKey = "score" | "updated";

export function sortDiscoveryArchiveRows(
  rows: DiscoveryCandidateRow[],
  key: DiscoveryArchiveSortKey,
  direction: "asc" | "desc"
): DiscoveryCandidateRow[] {
  const copy = [...rows];
  const factor = direction === "asc" ? 1 : -1;

  return copy.sort((a, b) => {
    if (key === "score") {
      return factor * (a.score - b.score) || a.symbol.localeCompare(b.symbol);
    }
    const dateA = new Date(a.snoozedUntil ?? a.updatedAt).getTime();
    const dateB = new Date(b.snoozedUntil ?? b.updatedAt).getTime();
    return factor * (dateA - dateB) || a.symbol.localeCompare(b.symbol);
  });
}
