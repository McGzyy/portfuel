import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { isCallTargetHit } from "@/lib/calls/target-hit";
import { isCallWin } from "@/lib/scoring/call-credit";
import { refreshQuotesForSymbols } from "@/lib/calls/service";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoMemberCalls, getDemoProfileCalls } from "@/lib/demo/fixtures";
import { fetchUserRecentCalls } from "@/lib/users/profile";

export type MemberBookCallRow = Awaited<ReturnType<typeof fetchUserRecentCalls>>[number];

export type MemberBookSymbolRow = {
  symbol: string;
  count: number;
  longCount: number;
  shortCount: number;
  avgReturnPct: number | null;
};

export type MemberOpenBookSummary = {
  openCount: number;
  uniqueSymbols: number;
  longCount: number;
  shortCount: number;
  equityCount: number;
  cryptoCount: number;
  avgReturnPct: number | null;
  winners: number;
  losers: number;
  best: { symbol: string; returnPct: number } | null;
  worst: { symbol: string; returnPct: number } | null;
  bySymbol: MemberBookSymbolRow[];
};

export type MemberOpenBook = {
  openCalls: MemberBookCallRow[];
  needsClose: MemberBookCallRow[];
  recentWrapped: MemberBookCallRow[];
  summary: MemberOpenBookSummary;
};

const BOOK_CALL_LIMIT = 80;

function summarizeOpenBook(calls: MemberBookCallRow[]): MemberOpenBookSummary {
  const withReturn = calls.filter((c) => c.return_pct != null);
  const avgReturnPct =
    withReturn.length > 0
      ? Math.round(
          (withReturn.reduce((sum, c) => sum + Number(c.return_pct), 0) / withReturn.length) * 10
        ) / 10
      : null;

  let best: MemberOpenBookSummary["best"] = null;
  let worst: MemberOpenBookSummary["worst"] = null;
  for (const c of withReturn) {
    const ret = Number(c.return_pct);
    if (!best || ret > best.returnPct) best = { symbol: c.symbol, returnPct: ret };
    if (!worst || ret < worst.returnPct) worst = { symbol: c.symbol, returnPct: ret };
  }

  const symbolMap = new Map<string, MemberBookSymbolRow>();
  for (const c of calls) {
    const sym = c.symbol.toUpperCase();
    let row = symbolMap.get(sym);
    if (!row) {
      row = { symbol: sym, count: 0, longCount: 0, shortCount: 0, avgReturnPct: null };
      symbolMap.set(sym, row);
    }
    row.count += 1;
    if (c.direction === "long") row.longCount += 1;
    else row.shortCount += 1;
  }

  for (const row of symbolMap.values()) {
    const symCalls = calls.filter((c) => c.symbol.toUpperCase() === row.symbol && c.return_pct != null);
    if (symCalls.length > 0) {
      row.avgReturnPct =
        Math.round(
          (symCalls.reduce((sum, c) => sum + Number(c.return_pct), 0) / symCalls.length) * 10
        ) / 10;
    }
  }

  const bySymbol = [...symbolMap.values()].sort((a, b) => b.count - a.count || a.symbol.localeCompare(b.symbol));

  return {
    openCount: calls.length,
    uniqueSymbols: bySymbol.length,
    longCount: calls.filter((c) => c.direction === "long").length,
    shortCount: calls.filter((c) => c.direction === "short").length,
    equityCount: calls.filter((c) => (c.asset_class ?? "equity") === "equity").length,
    cryptoCount: calls.filter((c) => c.asset_class === "crypto").length,
    avgReturnPct,
    winners: withReturn.filter((c) =>
      isCallWin({
        return_pct: c.return_pct != null ? Number(c.return_pct) : null,
        peak_return_pct:
          (c as { peak_return_pct?: number | null }).peak_return_pct != null
            ? Number((c as { peak_return_pct?: number | null }).peak_return_pct)
            : null,
        closed_at: (c as { closed_at?: string | null }).closed_at ?? null,
        target_progress: c.target_progress != null ? Number(c.target_progress) : null,
      })
    ).length,
    losers: withReturn.filter((c) => Number(c.return_pct) < 0).length,
    best,
    worst,
    bySymbol,
  };
}

async function loadUserCalls(userId: string): Promise<MemberBookCallRow[]> {
  if (isDemoMode()) {
    const demoMemberCalls = getDemoMemberCalls(userId, BOOK_CALL_LIMIT);
    if (demoMemberCalls.length > 0) return demoMemberCalls;
    return getDemoProfileCalls(userId).slice(0, BOOK_CALL_LIMIT);
  }

  let calls = await fetchUserRecentCalls(userId, BOOK_CALL_LIMIT);
  const symbols = [...new Set(calls.map((c) => c.symbol.toUpperCase()))];
  if (symbols.length > 0) {
    try {
      await refreshQuotesForSymbols(symbols);
      calls = await fetchUserRecentCalls(userId, BOOK_CALL_LIMIT);
    } catch (e) {
      console.error("[member-book/refresh quotes]", e);
    }
  }
  return calls;
}

/** Aggregate the signed-in member's live published calls as an open-book portfolio. */
export async function fetchMemberOpenBook(userId: string): Promise<MemberOpenBook> {
  const all = await loadUserCalls(userId);
  const memberCalls = all.filter((c) => !c.is_fueled);

  const openCalls = memberCalls.filter((c) => isOpenMemberCall(c));
  const needsClose = memberCalls.filter((c) =>
    isCallTargetHit({
      closed_at: (c as { closed_at?: string | null }).closed_at ?? null,
      target_price: c.target_price,
      target_progress: c.target_progress,
    })
  );
  const recentWrapped = memberCalls
    .filter(
      (c) =>
        !isOpenMemberCall(c) &&
        !isCallTargetHit({
          closed_at: (c as { closed_at?: string | null }).closed_at ?? null,
          target_price: c.target_price,
          target_progress: c.target_progress,
        })
    )
    .slice(0, 8);

  return {
    openCalls,
    needsClose,
    recentWrapped,
    summary: summarizeOpenBook(openCalls),
  };
}
