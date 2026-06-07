import { loadSocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { composeFueledMilestonePost } from "@/lib/social/x-compose";
import { getXConfig, xConfigSummary } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { uploadXMedia } from "@/lib/social/x-media";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";

export function fueledMilestoneChartUrl(
  callId: string,
  milestone: CallMilestoneKey
): string {
  return `/api/social/chart/${callId}?milestone=${milestone}&format=png`;
}

export async function postFueledMilestone(opts: {
  callId: string;
  milestone: CallMilestoneKey;
  dryRun?: boolean;
  force?: boolean;
}): Promise<
  | {
      ok: true;
      dryRun: boolean;
      text: string;
      lead: string;
      tail: string;
      refId: string;
      callId: string;
      milestone: CallMilestoneKey;
      tweetId?: string;
      withChart: true;
      chartUrl: string;
      chartGenerated: boolean;
      chartSizeBytes?: number;
      mediaAttached: boolean;
      config: ReturnType<typeof xConfigSummary>;
    }
  | { ok: false; error: string; text?: string; config?: ReturnType<typeof xConfigSummary> }
> {
  const config = getXConfig();
  const configSummary = xConfigSummary();
  const isExplicitDryRun = opts.dryRun === true;

  if (!config.enabled && !isExplicitDryRun) {
    return { ok: false, error: "disabled", config: configSummary };
  }

  const composed = await composeFueledMilestonePost(opts.callId, opts.milestone);
  if (!composed.ok) {
    return { ok: false, error: "no_content", config: configSummary };
  }

  if (!opts.force && !opts.dryRun) {
    const already = await hasSocialPostBeenSent("fueled_milestone", composed.refId);
    if (already) {
      return {
        ok: false,
        error: "already_posted",
        text: composed.text,
        config: configSummary,
      };
    }
  }

  const dryRun =
    opts.dryRun === true || config.dryRun || !configSummary.livePostingReady;

  const chartUrl = fueledMilestoneChartUrl(opts.callId, opts.milestone);
  let chartGenerated = false;
  let chartSizeBytes: number | undefined;
  let mediaIds: string[] | undefined;

  const chartPayload = await loadSocialChartPayload(opts.callId, opts.milestone);
  if ("error" in chartPayload) {
    return { ok: false, error: "chart_failed", text: composed.text, config: configSummary };
  }

  try {
    const png = await renderSocialChartPng(chartPayload);
    chartGenerated = true;
    chartSizeBytes = png.length;

    if (!dryRun) {
      const uploaded = await uploadXMedia(png);
      if (!uploaded.ok) {
        return {
          ok: false,
          error: uploaded.error,
          text: composed.text,
          config: configSummary,
        };
      }
      mediaIds = [uploaded.mediaId];
    }
  } catch (e) {
    console.error("[x-milestone-post] chart render", e);
    return { ok: false, error: "chart_failed", text: composed.text, config: configSummary };
  }

  if (dryRun) {
    console.info("[x-milestone-post dry-run]", composed.text, chartSizeBytes ? `(chart ${chartSizeBytes}b)` : "");
    return {
      ok: true,
      dryRun: true,
      text: composed.text,
      lead: composed.lead,
      tail: composed.tail,
      refId: composed.refId,
      callId: opts.callId,
      milestone: opts.milestone,
      withChart: true,
      chartUrl,
      chartGenerated,
      chartSizeBytes,
      mediaAttached: false,
      config: configSummary,
    };
  }

  const posted = await postToX(composed.text, mediaIds);
  if (!posted.ok) {
    return { ok: false, error: posted.error, text: composed.text, config: configSummary };
  }

  if (!posted.dryRun) {
    await recordSocialPost({
      postType: "fueled_milestone",
      refId: composed.refId,
      tweetId: posted.tweetId,
    });
  }

  return {
    ok: true,
    dryRun: posted.dryRun,
    text: composed.text,
    lead: composed.lead,
    tail: composed.tail,
    refId: composed.refId,
    callId: opts.callId,
    milestone: opts.milestone,
    tweetId: posted.tweetId,
    withChart: true,
    chartUrl,
    chartGenerated,
    chartSizeBytes,
    mediaAttached: Boolean(mediaIds?.length),
    config: configSummary,
  };
}
