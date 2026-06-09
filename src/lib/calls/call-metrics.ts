import {
  computeReturnPct,
  computeScorePoints,
  computeTargetProgress,
  updatePeakReturn,
} from "@/lib/scoring/returns";
import { createServiceClient } from "@/lib/db/supabase";
import { isMissingColumnDbError } from "@/lib/calls/call-fields";

export type CallMetricsRow = {
  id: string;
  direction: "long" | "short";
  called_at: string;
  entry_price: number | null;
  target_price: number | null;
  price_at_call: number | null;
  vote_score: number;
  peak_return_pct?: number | null;
  closed_at?: string | null;
};

export function buildLiveCallMetricsUpdate(
  call: CallMetricsRow,
  lastPrice: number
): {
  last_price: number;
  return_pct: number | null;
  peak_return_pct: number | null;
  target_progress: number | null;
  score_points: number;
} {
  const basis = call.entry_price ?? call.price_at_call;
  const returnPct =
    basis != null
      ? computeReturnPct({
          direction: call.direction,
          basisPrice: Number(basis),
          lastPrice,
        })
      : null;

  let targetProgress: number | null = null;
  if (call.entry_price && call.target_price) {
    targetProgress = computeTargetProgress({
      direction: call.direction,
      entry: Number(call.entry_price),
      target: Number(call.target_price),
      lastPrice,
    });
  }

  const peakReturnPct = updatePeakReturn(call.peak_return_pct, returnPct);
  const ageDays = (Date.now() - new Date(call.called_at).getTime()) / 86400000;
  const scorePoints = computeScorePoints({
    returnPct,
    peakReturnPct,
    closedAt: call.closed_at,
    targetProgress,
    voteScore: call.vote_score,
    ageDays,
  });

  return {
    last_price: lastPrice,
    return_pct: returnPct,
    peak_return_pct: peakReturnPct,
    target_progress: targetProgress,
    score_points: scorePoints,
  };
}

/** Persist live metrics; retries without peak column if migration is pending. */
export async function persistCallMetricsUpdate(
  callId: string,
  metrics: ReturnType<typeof buildLiveCallMetricsUpdate>
): Promise<boolean> {
  const db = createServiceClient();
  const { peak_return_pct: _peak, ...legacy } = metrics;

  let { error } = await db.from("calls").update(metrics as never).eq("id", callId);
  if (error && isMissingColumnDbError(error)) {
    ({ error } = await db.from("calls").update(legacy as never).eq("id", callId));
  }
  if (error) {
    console.error("[call-metrics/persist]", callId, error);
    return false;
  }
  return true;
}
