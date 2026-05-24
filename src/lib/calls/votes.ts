import { createServiceClient } from "@/lib/db/supabase";

export async function getUserCallVote(
  callId: string,
  userId: string
): Promise<-1 | 1 | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("call_votes")
    .select("value")
    .eq("call_id", callId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const v = Number(data.value);
  return v === 1 || v === -1 ? (v as 1 | -1) : null;
}

export async function recomputeCallVoteScore(callId: string): Promise<number> {
  const db = createServiceClient();
  const { data: rows } = await db.from("call_votes").select("value").eq("call_id", callId);
  const score = (rows ?? []).reduce((sum, r) => sum + Number(r.value), 0);
  await db.from("calls").update({ vote_score: score } as never).eq("id", callId);
  return score;
}

/** Set vote to 1, -1, or remove when value is 0. */
export async function setCallVote(
  callId: string,
  userId: string,
  value: -1 | 0 | 1
): Promise<{ voteScore: number; userVote: -1 | 1 | null }> {
  const db = createServiceClient();

  const { data: call } = await db.from("calls").select("id").eq("id", callId).maybeSingle();
  if (!call) throw new Error("call_not_found");

  if (value === 0) {
    await db.from("call_votes").delete().eq("call_id", callId).eq("user_id", userId);
  } else {
    const { error } = await db.from("call_votes").upsert(
      { call_id: callId, user_id: userId, value } as never,
      { onConflict: "call_id,user_id" }
    );
    if (error) throw error;
  }

  const voteScore = await recomputeCallVoteScore(callId);
  const userVote = value === 0 ? null : value;
  return { voteScore, userVote };
}
