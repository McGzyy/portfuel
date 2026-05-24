export type FeedCallSlice = {
  return_pct: number | null;
  is_fueled: boolean;
  direction: "long" | "short";
  target_progress?: number | null;
};

export type FeedSummary = {
  count: number;
  avgReturnPct: number | null;
  winners: number;
  losers: number;
  fueledCount: number;
  longCount: number;
  shortCount: number;
  avgTargetProgress: number | null;
};

export function summarizeFeed(calls: FeedCallSlice[]): FeedSummary {
  if (calls.length === 0) {
    return {
      count: 0,
      avgReturnPct: null,
      winners: 0,
      losers: 0,
      fueledCount: 0,
      longCount: 0,
      shortCount: 0,
      avgTargetProgress: null,
    };
  }

  const withReturn = calls.filter((c) => c.return_pct != null);
  const avgReturnPct =
    withReturn.length > 0
      ? withReturn.reduce((a, c) => a + (c.return_pct ?? 0), 0) / withReturn.length
      : null;

  const withProgress = calls.filter((c) => c.target_progress != null);
  const avgTargetProgress =
    withProgress.length > 0
      ? withProgress.reduce((a, c) => a + (c.target_progress ?? 0), 0) / withProgress.length
      : null;

  return {
    count: calls.length,
    avgReturnPct,
    winners: calls.filter((c) => (c.return_pct ?? 0) > 0).length,
    losers: calls.filter((c) => (c.return_pct ?? 0) < 0).length,
    fueledCount: calls.filter((c) => c.is_fueled).length,
    longCount: calls.filter((c) => c.direction === "long").length,
    shortCount: calls.filter((c) => c.direction === "short").length,
    avgTargetProgress,
  };
}
