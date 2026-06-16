/** Whether the signed-in member (or admin) may close this call at market. */
export function canCloseMemberCall(call: {
  is_fueled?: boolean;
  closed_at?: string | null;
  call_state?: string | null;
}): boolean {
  if (call.is_fueled) return false;
  if (call.closed_at) return false;
  if (call.call_state === "pending_entry") return false;
  if (call.call_state === "cancelled" || call.call_state === "expired") return false;
  return true;
}
