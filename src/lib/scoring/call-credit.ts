/** Return threshold — once peak meets this, the call counts as a win even if it retraces. */
export const WIN_CREDIT_RETURN_PCT = 10;

export type CallCreditInput = {
  return_pct: number | null;
  peak_return_pct?: number | null;
  closed_at?: string | null;
  target_progress?: number | null;
};

export function isCallClosed(call: { closed_at?: string | null }): boolean {
  return call.closed_at != null;
}

export function updatePeakReturn(
  existingPeak: number | null | undefined,
  liveReturn: number | null
): number | null {
  if (liveReturn == null) return existingPeak ?? null;
  if (existingPeak == null) return liveReturn;
  return Math.max(existingPeak, liveReturn);
}

export function effectivePeakReturn(call: CallCreditInput): number | null {
  const live = call.return_pct;
  const peak = call.peak_return_pct;
  if (live == null && peak == null) return null;
  if (live == null) return peak ?? null;
  if (peak == null) return live;
  return Math.max(live, peak);
}

/** Return used for rank score — live when closed; blended peak credit while open. */
export function creditReturnPct(call: CallCreditInput): number | null {
  const live = call.return_pct;
  if (live == null) return null;
  if (isCallClosed(call)) return live;
  const peak = effectivePeakReturn(call);
  if (peak == null) return live;
  return Math.max(live, peak * 0.5);
}

export function isCallWin(call: CallCreditInput): boolean {
  if (call.target_progress != null && call.target_progress >= 100) return true;

  const peak = effectivePeakReturn(call);
  if (peak != null && peak >= WIN_CREDIT_RETURN_PCT) return true;

  if (isCallClosed(call) && (call.return_pct ?? 0) > 0) return true;

  if (!isCallClosed(call) && (call.return_pct ?? 0) > 0) return true;

  return false;
}

export function showPeakedLabel(call: CallCreditInput): boolean {
  const live = call.return_pct;
  const peak = effectivePeakReturn(call);
  if (live == null || peak == null) return false;
  return peak > live + 0.05;
}
