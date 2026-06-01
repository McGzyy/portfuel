import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { composeXPost } from "@/lib/social/x-compose";
import { postToX } from "@/lib/social/x-client";
import { uploadXMedia } from "@/lib/social/x-media";
import { xConfigSummary } from "@/lib/social/x-config";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";
import { loadSocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";

const schema = z.object({
  type: z.enum(["fueled", "leaderboard", "fueled_milestone"]),
  dryRun: z.boolean().optional(),
  force: z.boolean().optional(),
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

    if (body.dryRun || config.dryRun || !config.configured) {
      console.info("[admin/social/post dry-run]", composed.text);
      return NextResponse.json({
        ok: true,
        dryRun: true,
        text: composed.text,
        refId: composed.refId,
        withChart: composed.withChart,
        config,
      });
    }

    let mediaIds: string[] | undefined;
    if (composed.withChart && composed.callId && composed.milestone) {
      const payload = await loadSocialChartPayload(
        composed.callId,
        composed.milestone as CallMilestoneKey
      );
      if ("error" in payload) {
        return NextResponse.json({ error: "chart_failed" }, { status: 502 });
      }
      const png = await renderSocialChartPng(payload);
      const uploaded = await uploadXMedia(png);
      if (!uploaded.ok) {
        return NextResponse.json({ error: uploaded.error, text: composed.text }, { status: 502 });
      }
      mediaIds = [uploaded.mediaId];
    }

    const posted = await postToX(composed.text, mediaIds);
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
