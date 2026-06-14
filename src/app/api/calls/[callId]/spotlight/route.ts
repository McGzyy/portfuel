import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import {
  confirmCallSpotlight,
  declineCallSpotlight,
  getCallSpotlightState,
} from "@/lib/social/spotlight-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await requireSession();
    const { callId } = await context.params;
    const state = await getCallSpotlightState(callId, session.userId);
    return NextResponse.json(state);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[calls/spotlight GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const postSchema = z.object({
  action: z.enum(["confirm", "decline"]),
  allowHighlight: z.boolean().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ callId: string }> }
) {
  try {
    const session = await requireSession();
    const { callId } = await context.params;
    const body = postSchema.parse(await request.json());

    if (body.action === "decline") {
      const result = await declineCallSpotlight(callId, session.userId);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ ok: true, status: "declined" });
    }

    const result = await confirmCallSpotlight(callId, session.userId, {
      allowHighlight: body.allowHighlight,
    });

    if (!result.ok) {
      const status =
        result.error === "forbidden"
          ? 403
          : result.error === "opt_in_required"
            ? 400
            : result.error === "already_posted"
              ? 409
              : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    if (result.mode === "posted") {
      return NextResponse.json({
        ok: true,
        status: "posted",
        tweetId: result.tweetId,
        tweetUrl: result.tweetUrl,
      });
    }

    return NextResponse.json({ ok: true, status: "pending_review" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[calls/spotlight POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
