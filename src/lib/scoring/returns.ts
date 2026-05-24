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
  voteScore: number;
  ageDays: number;
}): number {
  const ret = input.returnPct ?? 0;
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
