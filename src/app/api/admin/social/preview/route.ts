import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { composeXPost } from "@/lib/social/x-compose";
import { xConfigSummary } from "@/lib/social/x-config";

const schema = z.object({
  type: z.enum(["fueled", "leaderboard", "fueled_milestone"]),
  callId: z.string().uuid().optional(),
  milestone: z.enum(["return_10", "return_25", "target_reached"]).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const composed = await composeXPost(body.type, {
      callId: body.callId,
      milestone: body.milestone,
    });
    if (!composed.ok) {
      return NextResponse.json({ error: composed.error }, { status: 404 });
    }
    return NextResponse.json({
      text: composed.text,
      refId: composed.refId,
      charCount: composed.text.length,
      withChart: composed.withChart,
      callId: composed.callId,
      milestone: composed.milestone,
      chartUrl:
        composed.withChart && composed.callId && composed.milestone
          ? `/api/social/chart/${composed.callId}?milestone=${composed.milestone}&format=png`
          : null,
      config: xConfigSummary(),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/preview]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
