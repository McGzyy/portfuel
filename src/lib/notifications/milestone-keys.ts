export type CallMilestoneKey = "return_10" | "return_25" | "return_50" | "target_reached";

export type CallMilestoneInput = {
  return_pct: number | null;
  target_progress: number | null;
  entry_price?: number | null;
  target_price?: number | null;
};

/** Milestone keys a call has reached — shared by notifications, admin queue, and X posts. */
export function callMilestoneKeysForCall(call: CallMilestoneInput): CallMilestoneKey[] {
  const keys: CallMilestoneKey[] = [];
  const ret = call.return_pct;
  if (ret != null) {
    if (ret >= 10) keys.push("return_10");
    if (ret >= 25) keys.push("return_25");
    if (ret >= 50) keys.push("return_50");
  }
  if (
    call.entry_price != null &&
    call.target_price != null &&
    call.target_progress != null &&
    call.target_progress >= 100
  ) {
    keys.push("target_reached");
  }
  return keys;
}
