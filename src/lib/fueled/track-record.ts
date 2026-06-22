import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { getDemoCallsFeed } from "@/lib/demo/fixtures";

export type FueledTrackRecord = {
  totalCalls: number;
  openCalls: number;
  closedCalls: number;
  /** Avg return on closed calls only. */
  avgReturnPct: number | null;
  winRate: number | null;
  /** Live avg return on open calls (mark-to-market). */
  openAvgReturnPct: number | null;
  bestSymbol: string | null;
  bestReturnPct: number | null;
  recent: {
    id: string;
    symbol: string;
    direction: "long" | "short";
    return_pct: number | null;
    called_at: string;
    closed_at?: string | null;
  }[];
};

type CallRow = {
  return_pct: number | null;
  symbol: string;
  closed_at?: string | null;
};

function summarizeReturns(rows: CallRow[]): {
  avgReturnPct: number | null;
  winRate: number | null;
  bestSymbol: string | null;
  bestReturnPct: number | null;
} {
  const withReturn = rows.filter((r) => r.return_pct != null);
  const wins = withReturn.filter((r) => (r.return_pct ?? 0) > 0).length;
  const avg =
    withReturn.length > 0
      ? withReturn.reduce((s, r) => s + (r.return_pct ?? 0), 0) / withReturn.length
      : null;
  const best = withReturn.reduce<{ symbol: string; return_pct: number } | null>((acc, r) => {
    if (r.return_pct == null) return acc;
    if (!acc || r.return_pct > acc.return_pct) {
      return { symbol: r.symbol, return_pct: r.return_pct };
    }
    return acc;
  }, null);

  return {
    avgReturnPct: avg,
    winRate: withReturn.length > 0 ? (wins / withReturn.length) * 100 : null,
    bestSymbol: best?.symbol ?? null,
    bestReturnPct: best?.return_pct ?? null,
  };
}

export async function fetchFueledTrackRecord(): Promise<FueledTrackRecord> {
  if (isDemoMode()) {
    const fueled = getDemoCallsFeed("latest").filter((c) => c.is_fueled);
    const openRows = fueled.filter((c) => isOpenMemberCall(c));
    const closedRows = fueled.filter((c) => !isOpenMemberCall(c));
    const closedStats = summarizeReturns(closedRows);
    const openStats = summarizeReturns(openRows);
    return {
      totalCalls: fueled.length,
      openCalls: openRows.length,
      closedCalls: closedRows.length,
      avgReturnPct: closedStats.avgReturnPct,
      winRate: closedStats.winRate,
      openAvgReturnPct: openStats.avgReturnPct,
      bestSymbol: closedStats.bestSymbol ?? openStats.bestSymbol,
      bestReturnPct: closedStats.bestReturnPct ?? openStats.bestReturnPct,
      recent: fueled.slice(0, 5).map((c) => ({
        id: c.id,
        symbol: c.symbol,
        direction: c.direction as "long" | "short",
        return_pct: c.return_pct,
        called_at: c.called_at,
        closed_at: c.closed_at ?? null,
      })),
    };
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select("id, symbol, direction, return_pct, called_at, closed_at, target_progress")
    .eq("is_fueled", true)
    .order("called_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const openRows = rows.filter((r) => !r.closed_at);
  const closedRows = rows.filter((r) => r.closed_at);
  const closedStats = summarizeReturns(closedRows);
  const openStats = summarizeReturns(openRows);

  return {
    totalCalls: rows.length,
    openCalls: openRows.length,
    closedCalls: closedRows.length,
    avgReturnPct: closedStats.avgReturnPct,
    winRate: closedStats.winRate,
    openAvgReturnPct: openStats.avgReturnPct,
    bestSymbol: closedStats.bestSymbol ?? openStats.bestSymbol,
    bestReturnPct: closedStats.bestReturnPct ?? openStats.bestReturnPct,
    recent: rows.slice(0, 5).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      direction: c.direction as "long" | "short",
      return_pct: c.return_pct != null ? Number(c.return_pct) : null,
      called_at: c.called_at,
      closed_at: c.closed_at ?? null,
    })),
  };
}
