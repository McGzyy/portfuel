/** Member call still treated as an active / open thesis on the book. */
import { parseAppTimestamp } from "@/lib/time/timestamp";

export function isOpenMemberCall(call: {
  called_at: string;
  target_progress?: number | null;
  closed_at?: string | null;
  call_state?: string | null;
}): boolean {
  if (call.closed_at) return false;
  if (call.call_state === "cancelled" || call.call_state === "expired") return false;
  if (call.target_progress != null && call.target_progress >= 100) return false;
  const ageDays =
    (Date.now() - parseAppTimestamp(call.called_at).getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= 120;
}
