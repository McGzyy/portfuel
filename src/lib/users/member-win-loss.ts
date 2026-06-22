import { isCallClosed, isCallWin, type CallCreditInput } from "@/lib/scoring/call-credit";

export type MemberWinLossCall = CallCreditInput & {
  call_state?: string | null;
};

function isScoredCall(c: MemberWinLossCall): boolean {
  if (c.call_state === "pending_entry" || c.call_state === "cancelled" || c.call_state === "expired") {
    return false;
  }
  return c.return_pct != null;
}

/** Wins/losses aligned with profile win_rate — not chart marker counts. */
export function computeMemberWinLossCounts(calls: MemberWinLossCall[]): {
  wins: number;
  losses: number;
} {
  const scored = calls.filter(isScoredCall);
  const wins = scored.filter((c) => isCallWin(c)).length;
  const losses = scored.filter((c) => isCallClosed(c) && !isCallWin(c)).length;
  return { wins, losses };
}
