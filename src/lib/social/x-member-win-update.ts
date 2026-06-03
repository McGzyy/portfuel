import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { loadSocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import { composeMemberWinUpdatePost } from "@/lib/social/x-compose";
import { getXConfig } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { uploadXMedia } from "@/lib/social/x-media";
import {
  getSocialPostTweetId,
  hasSocialPostBeenSent,
  recordSocialPost,
} from "@/lib/social/post-log";

function memberWinUpdatesEnabled(): boolean {
  const raw = (process.env.X_POST_MEMBER_WIN_UPDATES ?? "").trim().toLowerCase();
  if (!raw) return false;
  if (["0", "false", "no"].includes(raw)) return false;
  return ["1", "true", "yes"].includes(raw);
}

/** Quote-tweet the original member spotlight when +25% or target is reached. */
export async function tryAutopostMemberWinUpdate(
  callId: string,
  milestone: CallMilestoneKey,
  opts?: { isFueled?: boolean }
): Promise<void> {
  if (opts?.isFueled) return;
  if (milestone !== "return_25" && milestone !== "target_reached") return;

  const config = getXConfig();
  if (!config.enabled || !memberWinUpdatesEnabled()) return;

  const parentTweetId = await getSocialPostTweetId("member_win", callId);
  if (!parentTweetId) return;

  const refId = `member_win_update-${callId}-${milestone}`;
  if (await hasSocialPostBeenSent("member_win_update", refId)) return;

  const composed = await composeMemberWinUpdatePost(callId, milestone);
  if (!composed.ok) return;

  let mediaIds: string[] | undefined;
  const chartPayload = await loadSocialChartPayload(callId, milestone, { memberWin: true });
  if (!("error" in chartPayload)) {
    try {
      const png = await renderSocialChartPng(chartPayload);
      const uploaded = await uploadXMedia(png);
      if (uploaded.ok) mediaIds = [uploaded.mediaId];
    } catch (e) {
      console.error("[x-member-win-update] chart", e);
    }
  }

  const posted = await postToX(composed.text, mediaIds, { quoteTweetId: parentTweetId });
  if (!posted.ok) {
    console.error("[x-member-win-update]", posted.error);
    return;
  }

  if (!posted.dryRun) {
    await recordSocialPost({
      postType: "member_win_update",
      refId,
      tweetId: posted.tweetId,
      parentTweetId,
    });
  }
}
