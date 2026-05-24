export type TradeSetupMetrics = {
  rewardPct: number | null;
  riskPct: number | null;
  riskReward: number | null;
  hint: string | null;
};

export function computeTradeSetup(
  direction: "long" | "short",
  entry: number,
  target?: number,
  stop?: number
): TradeSetupMetrics {
  if (!Number.isFinite(entry) || entry <= 0) {
    return { rewardPct: null, riskPct: null, riskReward: null, hint: null };
  }

  let rewardPct: number | null = null;
  let riskPct: number | null = null;
  let hint: string | null = null;

  if (target != null && Number.isFinite(target)) {
    rewardPct =
      direction === "long"
        ? ((target - entry) / entry) * 100
        : ((entry - target) / entry) * 100;
    if (direction === "long" && target <= entry) {
      hint = "Long targets should be above entry.";
    }
    if (direction === "short" && target >= entry) {
      hint = "Short targets should be below entry.";
    }
  }

  if (stop != null && Number.isFinite(stop)) {
    riskPct =
      direction === "long"
        ? ((entry - stop) / entry) * 100
        : ((stop - entry) / entry) * 100;
    if (direction === "long" && stop >= entry) {
      hint = hint ?? "Long stops should be below entry.";
    }
    if (direction === "short" && stop <= entry) {
      hint = hint ?? "Short stops should be above entry.";
    }
  }

  const riskReward =
    rewardPct != null && riskPct != null && riskPct > 0
      ? rewardPct / riskPct
      : null;

  return { rewardPct, riskPct, riskReward, hint };
}
