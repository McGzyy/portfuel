import { creditReturnPct } from "@/lib/scoring/call-credit";

export function computeReturnPct(input: {
  direction: "long" | "short";
  basisPrice: number;
  lastPrice: number;
}): number | null {
  const { direction, basisPrice, lastPrice } = input;
  if (!basisPrice || basisPrice <= 0 || !lastPrice) return null;
  const raw = ((lastPrice - basisPrice) / basisPrice) * 100;
  return direction === "long" ? raw : -raw;
}

export { creditReturnPct, isCallWin, updatePeakReturn } from "@/lib/scoring/call-credit";

export function computeTargetProgress(input: {
  direction: "long" | "short";
  entry: number;
  target: number;
  lastPrice: number;
}): number | null {
  const { direction, entry, target, lastPrice } = input;
  if (!entry || !target || !lastPrice) return null;
  const span = target - entry;
  if (Math.abs(span) < 1e-9) return null;
  const raw = ((lastPrice - entry) / span) * 100;
  const progress = direction === "long" ? raw : -raw;
  return Math.max(0, Math.min(100, progress));
}

export function computeScorePoints(input: {
  returnPct: number | null;
  peakReturnPct?: number | null;
  closedAt?: string | null;
  targetProgress?: number | null;
  voteScore: number;
  ageDays: number;
}): number {
  const credit = creditReturnPct({
    return_pct: input.returnPct,
    peak_return_pct: input.peakReturnPct,
    closed_at: input.closedAt,
    target_progress: input.targetProgress,
  });
  const ret = credit ?? 0;
  const voteBoost = Math.max(-5, Math.min(5, input.voteScore)) * 0.5;
  const decay = Math.max(0.3, 1 - input.ageDays / 90);
  return ret * decay + voteBoost;
}

export function computeHypeScore(input: {
  distinctCallers7d: number;
  totalCalls7d: number;
  commentCount7d: number;
}): number {
  const { distinctCallers7d, totalCalls7d, commentCount7d } = input;
  return Math.min(
    100,
    distinctCallers7d * 15 + totalCalls7d * 5 + commentCount7d * 2
  );
}
