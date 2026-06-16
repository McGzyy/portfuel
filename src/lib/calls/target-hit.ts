export type TargetHitCall = {
  closed_at?: string | null;
  target_price?: number | null;
  target_progress?: number | null;
};

/** Target reached on an open call — return still live until member closes. */
export function isCallTargetHit(call: TargetHitCall): boolean {
  if (call.closed_at) return false;
  if (call.target_price == null) return false;
  return call.target_progress != null && call.target_progress >= 100;
}
