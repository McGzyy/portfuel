import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { getUserCallVote, setCallVote } from "@/lib/calls/votes";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoCallId, isDemoMode } from "@/lib/demo/config";
import { getDemoCallById, getDemoVoteSnapshot } from "@/lib/demo/fixtures";

const voteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { callId } = await params;
    if (isDemoMode() && isDemoCallId(callId)) {
      if (!getDemoCallById(callId)) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return NextResponse.json(getDemoVoteSnapshot(callId));
    }
    const db = createServiceClient();
    const { data: call } = await db
      .from("calls")
      .select("vote_score")
      .eq("id", callId)
      .maybeSingle();
    if (!call) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const userVote = await getUserCallVote(callId, session.userId);
    return NextResponse.json({ voteScore: call.vote_score ?? 0, userVote });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[vote GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { callId } = await params;
    const body = voteSchema.parse(await request.json());

    if (isDemoMode() && isDemoCallId(callId)) {
      const snap = getDemoVoteSnapshot(callId);
      const delta = body.value === 0 ? 0 : body.value;
      return NextResponse.json({
        ok: true,
        voteScore: snap.voteScore + delta,
        userVote: body.value === 0 ? null : (body.value as -1 | 1),
      });
    }

    const existing = await getUserCallVote(callId, session.userId);
    let nextValue = body.value as -1 | 0 | 1;
    if (body.value !== 0 && existing === body.value) {
      nextValue = 0;
    }

    const result = await setCallVote(callId, session.userId, nextValue);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "call_not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[vote POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
