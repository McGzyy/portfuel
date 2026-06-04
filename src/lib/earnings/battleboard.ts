import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { fetchEarningsCalendarRange } from "@/lib/market/earnings-calendar";

export type EarningsBattleboardRow = {
  symbol: string;
  date: string;
  hour: string;
  quarter: number;
  year: number;
  communityCalls: number;
  openCalls: number;
  communityLongPct: number;
  deskDirection: "long" | "short" | null;
  bestReturnPct: number | null;
  avgTargetProgress: number | null;
};

const DAYS_AHEAD = 14;

function aggregateSymbolCalls(
  rows: {
    symbol: string;
    direction: string;
    return_pct: number | null;
    target_progress: number | null;
    is_fueled: boolean;
    called_at: string;
  }[]
): Map<
  string,
  {
    memberLong: number;
    memberTotal: number;
    openCalls: number;
    deskDirection: "long" | "short" | null;
    deskAt: string;
    bestReturn: number | null;
    targetSum: number;
    targetCount: number;
  }
> {
  const map = new Map<
    string,
    {
      memberLong: number;
      memberTotal: number;
      openCalls: number;
      deskDirection: "long" | "short" | null;
      deskAt: string;
      bestReturn: number | null;
      targetSum: number;
      targetCount: number;
    }
  >();

  for (const c of rows) {
    const sym = c.symbol.toUpperCase();
    const prev = map.get(sym) ?? {
      memberLong: 0,
      memberTotal: 0,
      openCalls: 0,
      deskDirection: null,
      deskAt: "",
      bestReturn: null,
      targetSum: 0,
      targetCount: 0,
    };

    const ret = c.return_pct != null ? Number(c.return_pct) : null;

    if (c.is_fueled) {
      if (c.called_at >= prev.deskAt) {
        prev.deskAt = c.called_at;
        prev.deskDirection = c.direction as "long" | "short";
      }
    } else {
      prev.memberTotal += 1;
      if (c.direction === "long") prev.memberLong += 1;
      if (ret != null) prev.openCalls += 1;
      if (c.target_progress != null) {
        prev.targetSum += Number(c.target_progress);
        prev.targetCount += 1;
      }
    }

    if (ret != null && (prev.bestReturn == null || ret > prev.bestReturn)) {
      prev.bestReturn = ret;
    }

    map.set(sym, prev);
  }

  return map;
}

function demoRows(): EarningsBattleboardRow[] {
  const base = new Date();
  const d = (offset: number) => {
    const x = new Date(base.getTime() + offset * 86400000);
    return x.toISOString().slice(0, 10);
  };
  return [
    {
      symbol: "NVDA",
      date: d(2),
      hour: "amc",
      quarter: 1,
      year: 2026,
      communityCalls: 5,
      openCalls: 4,
      communityLongPct: 80,
      deskDirection: "long",
      bestReturnPct: 12.4,
      avgTargetProgress: 62,
    },
    {
      symbol: "AAPL",
      date: d(5),
      hour: "amc",
      quarter: 2,
      year: 2026,
      communityCalls: 3,
      openCalls: 2,
      communityLongPct: 33,
      deskDirection: "long",
      bestReturnPct: 4.1,
      avgTargetProgress: 28,
    },
  ];
}

export async function fetchEarningsBattleboard(): Promise<EarningsBattleboardRow[]> {
  if (isDemoMode()) return demoRows();

  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + DAYS_AHEAD);

  const earnings = await fetchEarningsCalendarRange(from, to);
  if (earnings.length === 0) return [];

  const symbols = [...new Set(earnings.map((e) => e.symbol))];
  const db = createServiceClient();
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data, error } = await db
    .from("calls")
    .select("symbol, direction, return_pct, target_progress, is_fueled, called_at")
    .in("symbol", symbols)
    .gte("called_at", since30d);

  if (error) {
    console.error("[earnings/battleboard]", error);
    return earnings.slice(0, 20).map((e) => ({
      symbol: e.symbol,
      date: e.date,
      hour: e.hour,
      quarter: e.quarter,
      year: e.year,
      communityCalls: 0,
      openCalls: 0,
      communityLongPct: 0,
      deskDirection: null,
      bestReturnPct: null,
      avgTargetProgress: null,
    }));
  }

  const bySymbol = aggregateSymbolCalls(
    (data ?? []) as {
      symbol: string;
      direction: string;
      return_pct: number | null;
      target_progress: number | null;
      is_fueled: boolean;
      called_at: string;
    }[]
  );

  return earnings
    .map((e) => {
      const stats = bySymbol.get(e.symbol);
      const memberTotal = stats?.memberTotal ?? 0;
      const communityLongPct =
        memberTotal > 0 ? Math.round(((stats?.memberLong ?? 0) / memberTotal) * 100) : 0;

      return {
        symbol: e.symbol,
        date: e.date,
        hour: e.hour,
        quarter: e.quarter,
        year: e.year,
        communityCalls: memberTotal,
        openCalls: stats?.openCalls ?? 0,
        communityLongPct,
        deskDirection: stats?.deskDirection ?? null,
        bestReturnPct: stats?.bestReturn ?? null,
        avgTargetProgress:
          stats && stats.targetCount > 0
            ? Math.round(stats.targetSum / stats.targetCount)
            : null,
      };
    })
    .sort((a, b) => {
      const withCalls = Number(b.communityCalls > 0) - Number(a.communityCalls > 0);
      if (withCalls !== 0) return withCalls;
      return a.date.localeCompare(b.date) || a.symbol.localeCompare(b.symbol);
    })
    .slice(0, 40);
}

export type EarningsBattleboardSummary = {
  reportingCount: number;
  withCommunity: number;
  nextSymbol: string | null;
  nextDate: string | null;
};

export function summarizeBattleboard(rows: EarningsBattleboardRow[]): EarningsBattleboardSummary {
  const withCommunity = rows.filter((r) => r.communityCalls > 0).length;
  const next = rows.find((r) => r.communityCalls > 0) ?? rows[0];
  return {
    reportingCount: rows.length,
    withCommunity,
    nextSymbol: next?.symbol ?? null,
    nextDate: next?.date ?? null,
  };
}
