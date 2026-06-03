import { createServiceClient, type CallWithUser, type TeaserCallRow } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  getDemoCallsBySymbol,
  getDemoCallsFeed,
  getDemoPublicTeasers,
} from "@/lib/demo/fixtures";
import { processCallMilestones } from "@/lib/notifications/milestones";
import { processMemberWinGates } from "@/lib/social/member-win-gate";
import { refreshMemberRankings } from "@/lib/users/rankings";
import { getQuote, getCryptoLastPrice } from "@/lib/market/finnhub";
import {
  computeHypeScore,
  computeReturnPct,
  computeScorePoints,
  computeTargetProgress,
} from "@/lib/scoring/returns";

export type TeaserView =
  | "teaser_latest_calls"
  | "teaser_performing_calls"
  | "teaser_all_time_calls"
  | "teaser_public_performing"
  | "teaser_public_proven";

export async function fetchTeaserCalls(view: TeaserView): Promise<TeaserCallRow[]> {
  if (isDemoMode()) {
    const { performing, proven } = getDemoPublicTeasers();
    if (view === "teaser_public_performing") return performing;
    if (view === "teaser_public_proven") return proven;
    const mode = view === "teaser_performing_calls" ? "performing" : "latest";
    return getDemoCallsFeed(mode).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      asset_class: c.asset_class,
      direction: c.direction,
      thesis: c.thesis,
      called_at: c.called_at,
      return_pct: c.return_pct,
      target_progress: c.target_progress,
      is_fueled: c.is_fueled,
      vote_score: c.vote_score,
      comment_count: c.comment_count,
      display_name: c.users.display_name,
      pin: c.users.username ?? c.users.pin,
      is_trusted: Boolean(c.users.trusted_at),
    }));
  }
  const db = createServiceClient();
  const { data, error } = await db.from(view).select("*");
  if (error) throw error;
  return (data ?? []) as TeaserCallRow[];
}

export async function fetchCallsFeed(
  mode: "latest" | "performing"
): Promise<CallWithUser[]> {
  if (isDemoMode()) return getDemoCallsFeed(mode);
  const db = createServiceClient();
  let query = db
    .from("calls")
    .select(
      "*, users!inner(id, pin, username, display_name, trusted_at, rank_score, subscription_status)"
    )
    .eq("users.subscription_status", "active");

  if (mode === "latest") {
    query = query.order("called_at", { ascending: false }).limit(50);
  } else {
    query = query
      .not("return_pct", "is", null)
      .gt("return_pct", 0)
      .gte("called_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .order("return_pct", { ascending: false })
      .order("called_at", { ascending: false })
      .limit(50);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CallWithUser[];
}

export async function fetchCallsBySymbol(symbol: string): Promise<CallWithUser[]> {
  if (isDemoMode()) return getDemoCallsBySymbol(symbol);
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select("*, users!inner(id, pin, username, display_name, trusted_at, rank_score)")
    .eq("symbol", symbol.toUpperCase())
    .order("is_fueled", { ascending: false })
    .order("called_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CallWithUser[];
}

export async function refreshQuotesAndScores(): Promise<{
  updated: number;
  milestonesNotified: number;
  memberWinGates: number;
}> {
  const db = createServiceClient();
  const { data: calls, error } = await db.from("calls").select("*");
  if (error) throw error;

  const symbols = [...new Set((calls ?? []).map((c) => c.symbol))];
  const priceMap = new Map<string, number>();

  for (const sym of symbols) {
    const { data: snap } = await db
      .from("ticker_snapshots")
      .select("asset_class, finnhub_symbol")
      .eq("symbol", sym)
      .maybeSingle();

    const assetClass = snap?.asset_class ?? "equity";
    let lastPrice: number | null = null;

    if (assetClass === "crypto" && snap?.finnhub_symbol) {
      lastPrice = await getCryptoLastPrice(snap.finnhub_symbol);
    } else {
      const quote = await getQuote(sym);
      lastPrice = quote?.c ?? null;
    }

    if (lastPrice != null) {
      priceMap.set(sym, lastPrice);
      await db.from("ticker_snapshots").upsert({
        symbol: sym,
        last_price: lastPrice,
        asset_class: assetClass,
        finnhub_symbol: snap?.finnhub_symbol ?? null,
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

  for (const call of calls ?? []) {
    const last = priceMap.get(call.symbol);
    if (!last) continue;

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
      (Date.now() - new Date(call.called_at).getTime()) / (86400000);
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
    const symCalls = (calls ?? []).filter((c) => c.symbol === sym);
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

  return { updated, milestonesNotified, memberWinGates };
}
