export type MemberTrackRecord = {
  callCount: number;
  winners: number;
  losers: number;
  avgReturnPct: number | null;
  bestReturnPct: number | null;
  longCount: number;
  shortCount: number;
  fueledCount: number;
};

export function summarizeMemberTrackRecord(
  calls: {
    return_pct: number | null;
    direction: "long" | "short";
    is_fueled: boolean;
  }[]
): MemberTrackRecord {
  if (calls.length === 0) {
    return {
      callCount: 0,
      winners: 0,
      losers: 0,
      avgReturnPct: null,
      bestReturnPct: null,
      longCount: 0,
      shortCount: 0,
      fueledCount: 0,
    };
  }

  const withReturn = calls.filter((c) => c.return_pct != null);
  const avgReturnPct =
    withReturn.length > 0
      ? withReturn.reduce((a, c) => a + (c.return_pct ?? 0), 0) / withReturn.length
      : null;
  const bestReturnPct =
    withReturn.length > 0
      ? Math.max(...withReturn.map((c) => c.return_pct ?? 0))
      : null;

  return {
    callCount: calls.length,
    winners: calls.filter((c) => (c.return_pct ?? 0) > 0).length,
    losers: calls.filter((c) => (c.return_pct ?? 0) < 0).length,
    avgReturnPct,
    bestReturnPct,
    longCount: calls.filter((c) => c.direction === "long").length,
    shortCount: calls.filter((c) => c.direction === "short").length,
    fueledCount: calls.filter((c) => c.is_fueled).length,
  };
}
