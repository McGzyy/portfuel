import {
  computeReturnPct,
  computeTargetProgress,
} from "@/lib/scoring/returns";

export type CallLiveMetricsInput = {
  direction: "long" | "short";
  entry_price: number | null;
  target_price: number | null;
  price_at_call: number | null;
  return_pct: number | null;
  last_price: number | null;
  target_progress: number | null;
};

export type CallLiveMetrics = {
  last_price: number | null;
  return_pct: number | null;
  target_progress: number | null;
  live: boolean;
};

/** Recompute display metrics from a fresh market price (when DB row is stale). */
export function computeCallLiveMetrics(
  call: CallLiveMetricsInput,
  lastPrice: number | null
): CallLiveMetrics {
  if (lastPrice == null || !Number.isFinite(lastPrice)) {
    return {
      last_price: call.last_price,
      return_pct: call.return_pct,
      target_progress: call.target_progress,
      live: false,
    };
  }

  const basis = call.entry_price ?? call.price_at_call;
  const returnPct =
    basis != null
      ? computeReturnPct({
          direction: call.direction,
          basisPrice: Number(basis),
          lastPrice,
        })
      : null;

  let targetProgress: number | null = call.target_progress;
  if (call.entry_price && call.target_price) {
    targetProgress = computeTargetProgress({
      direction: call.direction,
      entry: Number(call.entry_price),
      target: Number(call.target_price),
      lastPrice,
    });
  }

  return {
    last_price: lastPrice,
    return_pct: returnPct,
    target_progress: targetProgress,
    live: true,
  };
}

export function enrichCallWithLivePrice<T extends CallLiveMetricsInput>(
  call: T,
  lastPrice: number | null
): T & CallLiveMetrics {
  const metrics = computeCallLiveMetrics(call, lastPrice);
  return { ...call, ...metrics };
}
