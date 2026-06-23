export type CallCloseReason = "manual" | "stop_hit" | "target_hit";

export const CALL_CLOSE_REASON_LABELS: Record<CallCloseReason, string> = {
  manual: "Closed",
  stop_hit: "Closed at stop",
  target_hit: "Closed at target",
};

export function closeReasonLabel(
  reason: CallCloseReason | string | null | undefined
): string | null {
  if (!reason) return null;
  if (reason in CALL_CLOSE_REASON_LABELS) {
    return CALL_CLOSE_REASON_LABELS[reason as CallCloseReason];
  }
  return null;
}
