import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { fetchMemberWinCandidates } from "@/lib/social/member-win-scan";
import { composeMemberWinPost } from "@/lib/social/x-compose";
import { postMemberWin } from "@/lib/social/x-member-win-post";
import { describeMemberWinRules } from "@/lib/social/member-win-eligibility";
import { getMemberWinGateConfig } from "@/lib/social/member-win-config";
import { xConfigSummary } from "@/lib/social/x-config";

export async function GET() {
  try {
    await requireAdmin();
    const candidates = await fetchMemberWinCandidates(15);
    return NextResponse.json({
      candidates,
      rulesSummary: describeMemberWinRules(),
      config: getMemberWinGateConfig(),
      x: xConfigSummary(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/member-wins GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const postSchema = z.object({
  callId: z.string().uuid(),
  dryRun: z.boolean().optional(),
  force: z.boolean().optional(),
  previewOnly: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = postSchema.parse(await request.json());

    if (body.previewOnly) {
      const composed = await composeMemberWinPost(body.callId, {
        skipReadiness: body.force === true,
      });
      if (!composed.ok) {
        return NextResponse.json({ error: composed.error }, { status: 404 });
      }
      return NextResponse.json({
        text: composed.text,
        charCount: composed.text.length,
        chartUrl: `/api/social/chart/${body.callId}?format=png&memberWin=1`,
      });
    }

    const result = await postMemberWin({
      callId: body.callId,
      dryRun: body.dryRun,
      force: body.force,
      skipReadiness: body.force,
    });

    if (!result.ok) {
      const status =
        result.error === "already_posted"
          ? 409
          : result.error === "no_content"
            ? 404
            : 502;
      return NextResponse.json({ error: result.error, text: result.text }, { status });
    }

    return NextResponse.json({
      ok: true,
      dryRun: result.dryRun,
      text: result.text,
      tweetId: result.tweetId,
      callId: result.callId,
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
    console.error("[admin/social/member-wins POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
