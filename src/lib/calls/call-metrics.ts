import {
  computeReturnPct,
  computeScorePoints,
  computeTargetProgress,
  updatePeakReturn,
} from "@/lib/scoring/returns";

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
