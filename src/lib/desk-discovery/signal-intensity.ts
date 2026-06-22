/** Per-hit score from signal strength — replaces flat SIGNAL_WEIGHTS when set. */

export function earningsIntensityWeight(daysUntil: number): number {
  const clamped = Math.max(2, Math.min(14, daysUntil));
  // 2d → 38, 14d → 18
  return Math.round(18 + ((14 - clamped) / 12) * 20);
}

export function priceMoveWeight(dailyChangeFraction: number): number {
  const pct = dailyChangeFraction * 100;
  return Math.min(32, Math.round(10 + pct * 1.4));
}

export function volumeAnomalyWeight(volumeRatio: number, dailyChangeFraction: number): number {
  const ratioBonus = Math.max(0, volumeRatio - 2) * 7;
  const moveBonus = dailyChangeFraction >= 0.06 ? 6 : dailyChangeFraction >= 0.04 ? 3 : 0;
  return Math.min(58, Math.round(24 + ratioBonus + moveBonus));
}

export function newsCatalystWeight(opts: {
  hoursAgo: number;
  keywordHits: number;
  isCompanySpecific?: boolean;
}): number {
  let w = 14 + Math.min(12, opts.keywordHits * 4);
  if (opts.isCompanySpecific) w += 6;
  if (opts.hoursAgo < 6) w += 10;
  else if (opts.hoursAgo < 24) w += 5;
  else if (opts.hoursAgo < 72) w += 2;
  return Math.min(38, w);
}

export function cryptoMomentumWeight(relativeVsBtc: number, symbolReturn: number): number {
  const relPct = relativeVsBtc * 100;
  const absBonus = symbolReturn >= 0.12 ? 4 : 0;
  return Math.min(42, Math.round(14 + relPct * 1.1 + absBonus));
}

export function communityHeatWeight(callCount: number, hypeScore: number | null): number {
  let w = 0;
  if (callCount >= 3) w += 22;
  else if (callCount >= 2) w += 16;
  else if (callCount >= 1) w += 8;
  if (hypeScore != null) {
    if (hypeScore >= 60) w += 12;
    else if (hypeScore >= 40) w += 8;
    else if (hypeScore >= 25) w += 4;
  }
  return Math.min(32, w);
}

export function recentFilingWeight(form: string, daysAgo: number): number {
  const isMaterial = /8-K|10-Q|10-K|S-1|6-K/i.test(form);
  if (!isMaterial || daysAgo > 5) return 0;
  return daysAgo <= 1 ? 22 : daysAgo <= 3 ? 16 : 12;
}
