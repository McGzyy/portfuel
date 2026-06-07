import { createServiceClient } from "@/lib/db/supabase";
import { getCoreCryptoAsset } from "@/lib/market/crypto-allowlist";
import { getCryptoLastPriceForSymbol } from "@/lib/market/crypto-candles";
import type { AssetClass } from "@/lib/market/validate-symbol";
import { getQuote } from "@/lib/market/finnhub";
import {
  computeHypeScore,
  computeReturnPct,
  computeScorePoints,
  computeTargetProgress,
} from "@/lib/scoring/returns";
import { computeCallLiveMetrics } from "@/lib/calls/live-metrics";
import { processCallMilestones } from "@/lib/notifications/milestones";
import { processMemberWinGates } from "@/lib/social/member-win-gate";
import { refreshMemberRankings } from "@/lib/users/rankings";

export type QuoteFetchResult = {
  symbol: string;
  lastPrice: number | null;
  assetClass: AssetClass;
  error?: string;
};

type CallRow = {
  id: string;
  user_id: string;
  symbol: string;
  asset_class?: AssetClass | null;
  direction: "long" | "short";
  called_at: string;
  entry_price: number | null;
  target_price: number | null;
  price_at_call: number | null;
  last_price: number | null;
  return_pct: number | null;
  target_progress: number | null;
  vote_score: number;
  comment_count: number;
  is_fueled: boolean;
};

async function loadSnapshot(sym: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("ticker_snapshots")
    .select("asset_class, finnhub_symbol")
    .eq("symbol", sym)
    .maybeSingle();
  return data as { asset_class?: AssetClass; finnhub_symbol?: string | null } | null;
}

export async function fetchLastPriceForSymbol(
  symbol: string,
  hints?: { assetClass?: AssetClass; finnhubSymbol?: string | null }
): Promise<QuoteFetchResult> {
  const sym = symbol.toUpperCase();
  const snap = hints?.assetClass ? null : await loadSnapshot(sym);
  const assetClass: AssetClass =
    hints?.assetClass ?? (snap?.asset_class as AssetClass) ?? "equity";
  const finnhubSymbol = hints?.finnhubSymbol ?? snap?.finnhub_symbol ?? null;

  try {
    if (assetClass === "crypto") {
      const lastPrice = await getCryptoLastPriceForSymbol(sym);
      return { symbol: sym, lastPrice, assetClass };
    }

    const quote = await getQuote(sym, { fresh: true });
    const lastPrice = quote?.c ?? null;
    if (lastPrice == null) {
      return { symbol: sym, lastPrice: null, assetClass, error: "quote_unavailable" };
    }
    return { symbol: sym, lastPrice, assetClass };
  } catch (e) {
    console.error("[quote-refresh/fetch]", sym, e);
    return {
      symbol: sym,
      lastPrice: null,
      assetClass,
      error: "fetch_failed",
    };
  }
}

function resolveSymbolHints(
  sym: string,
  calls: CallRow[],
  snap: { asset_class?: AssetClass; finnhub_symbol?: string | null } | null
): { assetClass: AssetClass; finnhubSymbol: string | null } {
  const core = getCoreCryptoAsset(sym);
  if (core) {
    return { assetClass: "crypto", finnhubSymbol: core.finnhub_symbol };
  }

  const symCalls = calls.filter((c) => c.symbol === sym);
  const fromCall = symCalls.find((c) => c.asset_class)?.asset_class;
  return {
    assetClass: (fromCall as AssetClass) ?? (snap?.asset_class as AssetClass) ?? "equity",
    finnhubSymbol: snap?.finnhub_symbol ?? null,
  };
}

/** Refresh return metrics for calls on the given symbols (e.g. when opening a ticker page). */
export async function refreshQuotesForSymbols(
  symbols: string[]
): Promise<{ updated: number; quotes: QuoteFetchResult[] }> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return { updated: 0, quotes: [] };

  const db = createServiceClient();
  const { data: calls, error } = await db.from("calls").select("*").in("symbol", unique);
  if (error) throw error;

  const allCalls = (calls ?? []) as CallRow[];
  const priceMap = new Map<string, number>();
  const quotes: QuoteFetchResult[] = [];

  for (const sym of unique) {
    const snap = await loadSnapshot(sym);
    const hints = resolveSymbolHints(sym, allCalls, snap);
    const result = await fetchLastPriceForSymbol(sym, hints);
    quotes.push(result);

    if (result.lastPrice != null) {
      priceMap.set(sym.toUpperCase(), result.lastPrice);
      await db.from("ticker_snapshots").upsert({
        symbol: sym,
        last_price: result.lastPrice,
        asset_class: result.assetClass,
        finnhub_symbol: hints.finnhubSymbol,
        updated_at: new Date().toISOString(),
      } as never);
    }
  }

  let updated = 0;
  const milestoneRows: {
    id: string;
    user_id: string;
    symbol: string;
    direction: string;
    called_at: string;
    is_fueled: boolean;
    entry_price: number | null;
    target_price: number | null;
    return_pct: number | null;
    target_progress: number | null;
  }[] = [];

  for (const call of allCalls) {
    const last = priceMap.get(call.symbol.toUpperCase());
    if (last == null) continue;

    const basis = call.entry_price ?? call.price_at_call;
    const returnPct =
      basis != null
        ? computeReturnPct({
            direction: call.direction,
            basisPrice: Number(basis),
            lastPrice: last,
          })
        : null;

    let targetProgress: number | null = null;
    if (call.entry_price && call.target_price) {
      targetProgress = computeTargetProgress({
        direction: call.direction,
        entry: Number(call.entry_price),
        target: Number(call.target_price),
        lastPrice: last,
      });
    }

    const ageDays =
      (Date.now() - new Date(call.called_at).getTime()) / 86400000;
    const scorePoints = computeScorePoints({
      returnPct,
      voteScore: call.vote_score,
      ageDays,
    });

    await db
      .from("calls")
      .update({
        last_price: last,
        return_pct: returnPct,
        target_progress: targetProgress,
        score_points: scorePoints,
      } as never)
      .eq("id", call.id);
    updated++;

    milestoneRows.push({
      id: call.id,
      user_id: call.user_id,
      symbol: call.symbol,
      direction: call.direction,
      called_at: call.called_at,
      is_fueled: Boolean(call.is_fueled),
      entry_price: call.entry_price,
      target_price: call.target_price,
      return_pct: returnPct,
      target_progress: targetProgress,
    });
  }

  if (milestoneRows.length > 0) {
    await processCallMilestones(milestoneRows);
    await processMemberWinGates(milestoneRows);
  }

  return { updated, quotes };
}

/** Write live-computed metrics to DB (e.g. after ticker page fetched a fresh quote). */
export async function persistCallsLiveMetrics(
  calls: Array<CallRow & { id: string }>,
  lastPrice: number
): Promise<number> {
  const db = createServiceClient();
  let n = 0;
  for (const call of calls) {
    const metrics = computeCallLiveMetrics(call, lastPrice);
    if (!metrics.live) continue;

    const { error } = await db
      .from("calls")
      .update({
        last_price: metrics.last_price,
        return_pct: metrics.return_pct,
        target_progress: metrics.target_progress,
      } as never)
      .eq("id", call.id);

    if (!error) n++;
    else console.error("[quote-refresh/persist]", call.id, error);
  }
  return n;
}

export async function refreshAllQuotesAndScores(): Promise<{
  updated: number;
  milestonesNotified: number;
  memberWinGates: number;
  quotes: QuoteFetchResult[];
}> {
  const db = createServiceClient();
  const { data: calls, error } = await db.from("calls").select("*");
  if (error) throw error;

  const rows = (calls ?? []) as CallRow[];
  const symbols = [...new Set(rows.map((c) => c.symbol))];
  const priceMap = new Map<string, number>();
  const quotes: QuoteFetchResult[] = [];

  for (const sym of symbols) {
    const snap = await loadSnapshot(sym);
    const hints = resolveSymbolHints(sym, rows, snap);
    const result = await fetchLastPriceForSymbol(sym, hints);
    quotes.push(result);

    if (result.lastPrice != null) {
      priceMap.set(sym.toUpperCase(), result.lastPrice);
      await db.from("ticker_snapshots").upsert({
        symbol: sym,
        last_price: result.lastPrice,
        asset_class: result.assetClass,
        finnhub_symbol: hints.finnhubSymbol,
        updated_at: new Date().toISOString(),
      } as never);
    }
  }

  let updated = 0;
  const milestoneRows: {
    id: string;
    user_id: string;
    symbol: string;
    direction: string;
    called_at: string;
    is_fueled: boolean;
    entry_price: number | null;
    target_price: number | null;
    return_pct: number | null;
    target_progress: number | null;
  }[] = [];

  for (const call of rows) {
    const last = priceMap.get(call.symbol.toUpperCase());
    if (last == null) continue;

    const basis = call.entry_price ?? call.price_at_call;
    const returnPct =
      basis != null
        ? computeReturnPct({
            direction: call.direction,
            basisPrice: Number(basis),
            lastPrice: last,
          })
        : null;

    let targetProgress: number | null = null;
    if (call.entry_price && call.target_price) {
      targetProgress = computeTargetProgress({
        direction: call.direction,
        entry: Number(call.entry_price),
        target: Number(call.target_price),
        lastPrice: last,
      });
    }

    const ageDays =
      (Date.now() - new Date(call.called_at).getTime()) / 86400000;
    const scorePoints = computeScorePoints({
      returnPct,
      voteScore: call.vote_score,
      ageDays,
    });

    await db
      .from("calls")
      .update({
        last_price: last,
        return_pct: returnPct,
        target_progress: targetProgress,
        score_points: scorePoints,
      } as never)
      .eq("id", call.id);
    updated++;

    milestoneRows.push({
      id: call.id,
      user_id: call.user_id,
      symbol: call.symbol,
      direction: call.direction,
      called_at: call.called_at,
      is_fueled: Boolean(call.is_fueled),
      entry_price: call.entry_price,
      target_price: call.target_price,
      return_pct: returnPct,
      target_progress: targetProgress,
    });
  }

  for (const sym of symbols) {
    const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
    const symCalls = rows.filter((c) => c.symbol === sym);
    const recent = symCalls.filter((c) => c.called_at >= since7d);
    const callers = new Set(recent.map((c) => c.user_id));
    const score = computeHypeScore({
      distinctCallers7d: callers.size,
      totalCalls7d: recent.length,
      commentCount7d: recent.reduce((a, c) => a + c.comment_count, 0),
    });
    await db.from("hype_scores").upsert({
      symbol: sym,
      score,
      components: {
        distinctCallers7d: callers.size,
        totalCalls7d: recent.length,
      },
      updated_at: new Date().toISOString(),
    } as never);
  }

  await refreshMemberRankings();

  const { notified: milestonesNotified } = await processCallMilestones(milestoneRows);
  const { gated: memberWinGates } = await processMemberWinGates(milestoneRows);

  return { updated, milestonesNotified, memberWinGates, quotes };
}
