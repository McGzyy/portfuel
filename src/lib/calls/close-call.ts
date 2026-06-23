import { createServiceClient } from "@/lib/db/supabase";
import { fetchLastPriceForSymbol } from "@/lib/calls/quote-refresh";
import type { CallCloseReason } from "@/lib/calls/close-reason";
import {
  computeReturnPct,
  computeScorePoints,
  computeTargetProgress,
  updatePeakReturn,
} from "@/lib/scoring/returns";
import { refreshMemberRankings } from "@/lib/users/rankings";

export type CloseCallResult =
  | { ok: true; returnPct: number | null; exitPrice: number | null }
  | { ok: false; error: "not_found" | "forbidden" | "already_closed" | "fueled_desk" | "no_price" };

type CallRow = {
  id: string;
  user_id: string;
  symbol: string;
  asset_class?: "equity" | "crypto" | null;
  direction: "long" | "short";
  called_at: string;
  entry_price: number | null;
  target_price: number | null;
  price_at_call: number | null;
  last_price: number | null;
  return_pct: number | null;
  peak_return_pct: number | null;
  target_progress: number | null;
  vote_score: number;
  is_fueled: boolean;
  closed_at: string | null;
};

async function loadCallRow(callId: string): Promise<CallRow | null> {
  const db = createServiceClient();
  const { data: row, error } = await db
    .from("calls")
    .select(
      "id, user_id, symbol, asset_class, direction, called_at, entry_price, target_price, price_at_call, last_price, return_pct, peak_return_pct, target_progress, vote_score, is_fueled, closed_at"
    )
    .eq("id", callId)
    .maybeSingle();

  if (error) throw error;
  return row ? (row as CallRow) : null;
}

async function finalizeCallClose(
  call: CallRow,
  exitPrice: number,
  closeReason: CallCloseReason
): Promise<CloseCallResult> {
  const basis = call.entry_price ?? call.price_at_call;
  const returnPct =
    basis != null
      ? computeReturnPct({
          direction: call.direction,
          basisPrice: Number(basis),
          lastPrice: exitPrice,
        })
      : null;

  let targetProgress = call.target_progress;
  if (call.entry_price && call.target_price) {
    targetProgress = computeTargetProgress({
      direction: call.direction,
      entry: Number(call.entry_price),
      target: Number(call.target_price),
      lastPrice: exitPrice,
    });
  }

  const peakReturnPct = updatePeakReturn(call.peak_return_pct, returnPct);
  const ageDays = (Date.now() - new Date(call.called_at).getTime()) / 86400000;
  const scorePoints = computeScorePoints({
    returnPct,
    peakReturnPct,
    closedAt: new Date().toISOString(),
    targetProgress,
    voteScore: call.vote_score,
    ageDays,
  });

  const closedAt = new Date().toISOString();
  const db = createServiceClient();
  const { error: updateError } = await db
    .from("calls")
    .update({
      closed_at: closedAt,
      exit_price: exitPrice,
      last_price: exitPrice,
      return_pct: returnPct,
      peak_return_pct: peakReturnPct,
      target_progress: targetProgress,
      score_points: scorePoints,
      close_reason: closeReason,
    } as never)
    .eq("id", call.id);

  if (updateError) throw updateError;

  try {
    await refreshMemberRankings();
  } catch (e) {
    console.error("[close-call/rankings]", e);
  }

  return { ok: true, returnPct, exitPrice };
}

/** Lock a member call at stop or target — used by quote cron. */
export async function autoCloseCallAtLevel(
  callId: string,
  exitPrice: number,
  closeReason: "stop_hit" | "target_hit"
): Promise<CloseCallResult> {
  const call = await loadCallRow(callId);
  if (!call) return { ok: false, error: "not_found" };
  if (call.is_fueled) return { ok: false, error: "fueled_desk" };
  if (call.closed_at) return { ok: false, error: "already_closed" };
  if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
    return { ok: false, error: "no_price" };
  }

  return finalizeCallClose(call, exitPrice, closeReason);
}

/** Lock a member call at the current market price — return frozen for stats. */
export async function closeCall(params: {
  callId: string;
  actorUserId: string;
  isAdmin: boolean;
}): Promise<CloseCallResult> {
  const call = await loadCallRow(params.callId);
  if (!call) return { ok: false, error: "not_found" };

  if (call.user_id !== params.actorUserId && !params.isAdmin) {
    return { ok: false, error: "forbidden" };
  }
  if (call.is_fueled) return { ok: false, error: "fueled_desk" };
  if (call.closed_at) return { ok: false, error: "already_closed" };

  const quote = await fetchLastPriceForSymbol(call.symbol, {
    assetClass: call.asset_class ?? undefined,
  });
  const exitPrice =
    quote.lastPrice ?? (call.last_price != null ? Number(call.last_price) : null);
  if (exitPrice == null) return { ok: false, error: "no_price" };

  return finalizeCallClose(call, exitPrice, "manual");
}
