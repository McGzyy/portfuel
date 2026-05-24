import type { LeaderboardEntry } from "@/lib/calls/leaderboard";

export type RankingsSummary = {
  rankedCount: number;
  trustedCount: number;
  totalCalls: number;
  avgWinRate: number | null;
  topScore: number | null;
};

export function summarizeRankings(rows: LeaderboardEntry[]): RankingsSummary {
  if (rows.length === 0) {
    return {
      rankedCount: 0,
      trustedCount: 0,
      totalCalls: 0,
      avgWinRate: null,
      topScore: null,
    };
  }

  const withWin = rows.filter((r) => r.win_rate != null);
  const avgWinRate =
    withWin.length > 0
      ? withWin.reduce((a, r) => a + (r.win_rate ?? 0), 0) / withWin.length
      : null;

  return {
    rankedCount: rows.length,
    trustedCount: rows.filter((r) => r.trusted).length,
    totalCalls: rows.reduce((a, r) => a + r.calls_count, 0),
    avgWinRate,
    topScore: rows[0]?.rank_score ?? null,
  };
}
