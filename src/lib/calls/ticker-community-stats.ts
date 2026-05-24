import type { CallWithUser } from "@/lib/db/supabase";

export type TickerCommunityStats = {
  callCount: number;
  longCount: number;
  shortCount: number;
  fueledCount: number;
  avgReturnPct: number | null;
  bestReturnPct: number | null;
  trustedCallers: number;
};

export function summarizeTickerCommunity(calls: CallWithUser[]): TickerCommunityStats {
  if (calls.length === 0) {
    return {
      callCount: 0,
      longCount: 0,
      shortCount: 0,
      fueledCount: 0,
      avgReturnPct: null,
      bestReturnPct: null,
      trustedCallers: 0,
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

  const trustedIds = new Set(
    calls.filter((c) => c.users.trusted_at).map((c) => c.user_id)
  );

  return {
    callCount: calls.length,
    longCount: calls.filter((c) => c.direction === "long").length,
    shortCount: calls.filter((c) => c.direction === "short").length,
    fueledCount: calls.filter((c) => c.is_fueled).length,
    avgReturnPct,
    bestReturnPct,
    trustedCallers: trustedIds.size,
  };
}
