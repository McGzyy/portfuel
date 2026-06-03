import { composeXPost } from "@/lib/social/x-compose";
import { getXConfig, type XPostType } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { postMemberWin } from "@/lib/social/x-member-win-post";
import { postWeeklyDigest } from "@/lib/social/x-weekly-digest-post";
import { pickNextMemberWinCallId } from "@/lib/social/member-win-scan";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";
import { loadSocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import { uploadXMedia } from "@/lib/social/x-media";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";

export async function runXSocialBatch(opts?: {
  types?: XPostType[];
  forceDryRun?: boolean;
  memberWinCallId?: string;
}): Promise<{
  results: Array<{
    type: XPostType;
    status: "posted" | "dry_run" | "skipped" | "error" | "already_posted";
    text?: string;
    error?: string;
    tweetId?: string;
  }>;
}> {
  const config = getXConfig();
  const types = opts?.types ?? (["fueled", "leaderboard"] as XPostType[]);
  const results: Array<{
    type: XPostType;
    status: "posted" | "dry_run" | "skipped" | "error" | "already_posted";
    text?: string;
    error?: string;
    tweetId?: string;
  }> = [];

  if (!config.enabled) {
    for (const type of types) {
      results.push({ type, status: "skipped", error: "disabled" });
    }
    return { results };
  }

  for (const type of types) {
    if (type === "fueled" && !config.fueledPosts) {
      results.push({ type, status: "skipped", error: "type_disabled" });
      continue;
    }
    if (type === "leaderboard" && !config.leaderboardPosts) {
      results.push({ type, status: "skipped", error: "type_disabled" });
      continue;
    }
    if (type === "member_win" && !config.memberWinPosts) {
      results.push({ type, status: "skipped", error: "type_disabled" });
      continue;
    }
    if (type === "weekly_digest" && !config.weeklyDigestPosts) {
      results.push({ type, status: "skipped", error: "type_disabled" });
      continue;
    }

    if (type === "weekly_digest") {
      const posted = await postWeeklyDigest({ dryRun: opts?.forceDryRun });
      results.push({
        type,
        status: posted.ok
          ? posted.dryRun
            ? "dry_run"
            : "posted"
          : posted.error === "already_posted"
            ? "already_posted"
            : "skipped",
        text: posted.text,
        error: posted.ok ? undefined : posted.error,
        tweetId: posted.ok ? posted.tweetId : undefined,
      });
      continue;
    }

    if (type === "member_win") {
      const callId = opts?.memberWinCallId ?? (await pickNextMemberWinCallId());
      if (!callId) {
        results.push({ type, status: "skipped", error: "no_content" });
        continue;
      }
      if (opts?.forceDryRun) {
        const preview = await postMemberWin({ callId, dryRun: true });
        results.push({
          type,
          status: preview.ok ? "dry_run" : "skipped",
          text: preview.text,
          error: preview.ok ? undefined : preview.error,
        });
        continue;
      }
      const posted = await postMemberWin({ callId });
      results.push({
        type,
        status: posted.ok
          ? posted.dryRun
            ? "dry_run"
            : "posted"
          : posted.error === "already_posted"
            ? "already_posted"
            : "skipped",
        text: posted.text,
        error: posted.ok ? undefined : posted.error,
        tweetId: posted.ok ? posted.tweetId : undefined,
      });
      continue;
    }

    const composed = await composeXPost(type);
    if (!composed.ok) {
      results.push({ type, status: "skipped", error: composed.error });
      continue;
    }

    const alreadySent = await hasSocialPostBeenSent(type, composed.refId);
    if (alreadySent && !opts?.forceDryRun) {
      results.push({
        type,
        status: "already_posted",
        text: composed.text,
        error: composed.refId,
      });
      continue;
    }

    if (opts?.forceDryRun) {
      console.info("[x-social force-dry-run]", composed.text);
      results.push({ type, status: "dry_run", text: composed.text, tweetId: "dry_run" });
      continue;
    }

    let mediaIds: string[] | undefined;
    if (
      composed.withChart &&
      composed.callId &&
      composed.milestone &&
      type === "fueled_milestone"
    ) {
      const payload = await loadSocialChartPayload(
        composed.callId,
        composed.milestone as CallMilestoneKey
      );
      if (!("error" in payload)) {
        try {
          const png = await renderSocialChartPng(payload);
          const uploaded = await uploadXMedia(png);
          if (uploaded.ok) mediaIds = [uploaded.mediaId];
        } catch (e) {
          console.error("[x-run] milestone chart", e);
        }
      }
    }

    const posted = await postToX(composed.text, mediaIds);
    if (!posted.ok) {
      results.push({ type, status: "error", text: composed.text, error: posted.error });
      continue;
    }

    if (!posted.dryRun) {
      await recordSocialPost({
        postType: type,
        refId: composed.refId,
        tweetId: posted.tweetId,
      });
    }

    results.push({
      type,
      status: posted.dryRun ? "dry_run" : "posted",
      text: composed.text,
      tweetId: posted.tweetId,
    });
  }

  return { results };
}
