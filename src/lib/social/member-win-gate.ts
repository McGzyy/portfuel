import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  MEMBER_WIN_GATE_MILESTONE_KEY,
} from "@/lib/social/member-win-config";
import { meetsMemberWinReturnAgeGate } from "@/lib/social/member-win-eligibility";

type GateRow = {
  id: string;
  user_id: string;
  return_pct: number | null;
  called_at: string;
  is_fueled: boolean;
};

async function recordGate(callId: string, userId: string): Promise<boolean> {
  const db = createServiceClient();
  const { error } = await db.from("call_milestones").insert({
    call_id: callId,
    user_id: userId,
    key: MEMBER_WIN_GATE_MILESTONE_KEY,
  } as never);

  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("[member-win-gate/record]", error);
  return false;
}

/** After quote refresh: stamp social_win_gate when a call first crosses return+age rules. */
export async function processMemberWinGates(calls: GateRow[]): Promise<{ gated: number }> {
  if (isDemoMode()) return { gated: 0 };

  let gated = 0;
  for (const call of calls) {
    const check = meetsMemberWinReturnAgeGate(call);
    if (!check.ok) continue;
    const isNew = await recordGate(call.id, call.user_id);
    if (isNew) gated++;
  }
  return { gated };
}
