import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { createCallComment, listCallComments } from "@/lib/calls/comments";
import { createServiceClient } from "@/lib/db/supabase";

const commentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const db = createServiceClient();
    const { data: call } = await db
      .from("calls")
      .select("id, comment_count")
      .eq("id", callId)
      .maybeSingle();
    if (!call) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const comments = await listCallComments(callId);
    return NextResponse.json({ comments, commentCount: call.comment_count ?? 0 });
  } catch (e) {
    console.error("[comments GET]", e);
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
    const body = commentSchema.parse(await request.json());
    const comment = await createCallComment(callId, session.userId, body.body);

    const db = createServiceClient();
    const { data: call } = await db
      .from("calls")
      .select("comment_count")
      .eq("id", callId)
      .single();

    return NextResponse.json({
      ok: true,
      comment,
      commentCount: call?.comment_count ?? 0,
    });
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
    console.error("[comments POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
