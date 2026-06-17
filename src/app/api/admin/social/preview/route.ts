import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { composeXPost } from "@/lib/social/x-compose";
import { getEffectiveXAutomation } from "@/lib/social/x-automation-prefs";
import { xConfigSummary } from "@/lib/social/x-config";
import { fueledMilestoneChartUrl } from "@/lib/social/x-milestone-post";
import { socialCallIdSchema } from "@/lib/social/social-call-id";

export async function GET() {
  try {
    await requireAdmin();
    const env = xConfigSummary();
    const automation = await getEffectiveXAutomation();
    return NextResponse.json({
      config: {
        ...env,
        fueledPosts: automation.cronFueledPosts,
        leaderboardPosts: automation.cronLeaderboardPosts,
        memberWinPosts: automation.cronMemberWinPosts,
        weeklyDigestPosts: automation.cronWeeklyDigestPosts,
        autopostFueledOnPublish: automation.autopostFueledOnPublish,
        autopostMilestones: automation.autopostMilestones,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/social/preview GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const schema = z.object({
  type: z.enum(["fueled", "leaderboard", "fueled_milestone", "member_win"]),
  callId: socialCallIdSchema.optional(),
  milestone: z.enum(["return_10", "return_25", "target_reached"]).optional(),
  force: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    if (body.type === "member_win" && !body.callId) {
      return NextResponse.json({ error: "call_id_required" }, { status: 400 });
    }

    const composed = await composeXPost(body.type, {
      callId: body.callId,
      milestone: body.milestone,
      skipMemberWinReadiness: body.force,
    });
    if (!composed.ok) {
      return NextResponse.json({ error: composed.error }, { status: 404 });
    }
    return NextResponse.json({
      text: composed.text,
      lead: composed.lead,
      tail: composed.tail,
      refId: composed.refId,
      charCount: composed.text.length,
      withChart: composed.withChart,
      callId: composed.callId,
      milestone: composed.milestone,
      chartUrl:
        composed.withChart && composed.callId
          ? body.type === "member_win"
            ? `/api/social/chart/${composed.callId}?format=png&memberWin=1`
            : composed.milestone
              ? fueledMilestoneChartUrl(composed.callId, composed.milestone)
              : null
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
