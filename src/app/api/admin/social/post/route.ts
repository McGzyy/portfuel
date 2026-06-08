import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { composeXPost } from "@/lib/social/x-compose";
import { postToX } from "@/lib/social/x-client";
import { xConfigSummary } from "@/lib/social/x-config";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";
import { postFueledMilestone } from "@/lib/social/x-milestone-post";
import { socialCallIdSchema } from "@/lib/social/social-call-id";

const schema = z.object({
  type: z.enum(["fueled", "leaderboard", "fueled_milestone", "member_win"]),
  dryRun: z.boolean().optional(),
  force: z.boolean().optional(),
  callId: socialCallIdSchema.optional(),
  milestone: z.enum(["return_10", "return_25", "target_reached"]).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());

    if (body.type === "fueled_milestone") {
      if (!body.callId || !body.milestone) {
        return NextResponse.json({ error: "call_id_and_milestone_required" }, { status: 400 });
      }
      const result = await postFueledMilestone({
        callId: body.callId,
        milestone: body.milestone,
        dryRun: body.dryRun,
        force: body.force,
      });
      if (!result.ok) {
        const status =
          result.error === "already_posted"
            ? 409
            : result.error === "no_content" || result.error === "disabled"
              ? 404
              : 502;
        return NextResponse.json(
          { error: result.error, text: result.text, config: result.config },
          { status }
        );
      }
      return NextResponse.json({
        ok: true,
        dryRun: result.dryRun,
        tweetId: result.tweetId,
        text: result.text,
        lead: result.lead,
        tail: result.tail,
        refId: result.refId,
        callId: result.callId,
        milestone: result.milestone,
        withChart: result.withChart,
        chartUrl: result.chartUrl,
        chartGenerated: result.chartGenerated,
        chartSizeBytes: result.chartSizeBytes,
        mediaAttached: result.mediaAttached,
        config: result.config,
      });
    }

    if (body.type === "member_win") {
      if (!body.callId) {
        return NextResponse.json({ error: "call_id_required" }, { status: 400 });
      }
      const { postMemberWin } = await import("@/lib/social/x-member-win-post");
      const result = await postMemberWin({
        callId: body.callId,
        dryRun: body.dryRun,
        force: body.force,
        skipReadiness: body.force,
      });
      if (!result.ok) {
        const status = result.error === "already_posted" ? 409 : result.error === "no_content" ? 404 : 502;
        return NextResponse.json({ error: result.error, text: result.text }, { status });
      }
      return NextResponse.json({
        ok: true,
        dryRun: result.dryRun,
        tweetId: result.tweetId,
        text: result.text,
        lead: result.text,
        tail: "",
        refId: body.callId,
        callId: result.callId,
        withChart: true,
        chartUrl: result.chartUrl,
        chartGenerated: result.chartGenerated,
        chartSizeBytes: result.chartSizeBytes,
        mediaAttached: result.mediaAttached,
        config: xConfigSummary(),
      });
    }

    const composed = await composeXPost(body.type, {
      callId: body.callId,
      milestone: body.milestone,
    });
    if (!composed.ok) {
      return NextResponse.json({ error: composed.error }, { status: 404 });
    }

    const config = xConfigSummary();
    const postType = body.type;

    if (!body.dryRun && !body.force) {
      const alreadySent = await hasSocialPostBeenSent(postType, composed.refId);
      if (alreadySent) {
        return NextResponse.json({
          ok: false,
          error: "already_posted",
          text: composed.text,
          refId: composed.refId,
          config,
        });
      }
    }

    if (body.dryRun || config.dryRun || !config.livePostingReady) {
      console.info("[admin/social/post dry-run]", composed.text);
      return NextResponse.json({
        ok: true,
        dryRun: true,
        text: composed.text,
        lead: composed.lead,
        tail: composed.tail,
        refId: composed.refId,
        withChart: composed.withChart,
        config,
      });
    }

    const posted = await postToX(composed.text);
    if (!posted.ok) {
      return NextResponse.json({ error: posted.error, text: composed.text }, { status: 502 });
    }

    if (!posted.dryRun) {
      await recordSocialPost({
        postType,
        refId: composed.refId,
        tweetId: posted.tweetId,
      });
    }

    return NextResponse.json({
      ok: true,
      dryRun: posted.dryRun,
      tweetId: posted.tweetId,
      text: composed.text,
      refId: composed.refId,
      withChart: composed.withChart,
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
