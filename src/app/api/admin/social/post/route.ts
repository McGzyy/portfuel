import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { composeXPost } from "@/lib/social/x-compose";
import { postToX } from "@/lib/social/x-client";
import { xConfigSummary } from "@/lib/social/x-config";

const schema = z.object({
  type: z.enum(["fueled", "leaderboard"]),
  dryRun: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const composed = await composeXPost(body.type);
    if (!composed.ok) {
      return NextResponse.json({ error: composed.error }, { status: 404 });
    }

    const config = xConfigSummary();
    if (body.dryRun || config.dryRun || !config.configured) {
      console.info("[admin/social/post dry-run]", composed.text);
      return NextResponse.json({
        ok: true,
        dryRun: true,
        text: composed.text,
        refId: composed.refId,
        config,
      });
    }

    const posted = await postToX(composed.text);
    if (!posted.ok) {
      return NextResponse.json({ error: posted.error, text: composed.text }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      dryRun: posted.dryRun,
      tweetId: posted.tweetId,
      text: composed.text,
      refId: composed.refId,
      config,
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
    console.error("[admin/social/post]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
