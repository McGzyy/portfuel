import type { LeaderboardEntry } from "@/lib/calls/leaderboard";

export type LeaderboardSortKey = "score" | "win_rate" | "calls" | "name";
export type SortDirection = "asc" | "desc";

export function sortLeaderboardRows(
  rows: LeaderboardEntry[],
  key: LeaderboardSortKey,
  direction: SortDirection
): LeaderboardEntry[] {
  const sorted = [...rows];
  const sign = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (key) {
      case "score":
        return sign * (a.rank_score - b.rank_score);
      case "win_rate": {
        const av = a.win_rate ?? -1;
        const bv = b.win_rate ?? -1;
        return sign * (av - bv);
      }
      case "calls":
        return sign * (a.calls_count - b.calls_count);
      case "name": {
        const an = (a.display_name ?? a.username ?? "").toLowerCase();
        const bn = (b.display_name ?? b.username ?? "").toLowerCase();
        return sign * an.localeCompare(bn);
      }
      default:
        return 0;
    }
  });

  return sorted;
}

export function nextSortDirection(
  currentKey: LeaderboardSortKey,
  clickedKey: LeaderboardSortKey,
  currentDir: SortDirection
): SortDirection {
  if (currentKey !== clickedKey) return clickedKey === "name" ? "asc" : "desc";
  return currentDir === "desc" ? "asc" : "desc";
}
