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

function stillRunningEnabled(): boolean {
  const raw = (process.env.X_POST_MEMBER_WIN_STILL_RUNNING ?? "").trim().toLowerCase();
  if (!raw) return false;
  if (["0", "false", "no"].includes(raw)) return false;
  return ["1", "true", "yes"].includes(raw);
}

function stillRunningMinPct(): number {
  const n = Number(process.env.X_MEMBER_WIN_STILL_RUNNING_MIN_PCT ?? 15);
  return Number.isFinite(n) && n > 0 ? n : 15;
}

/** Quote-tweet the original spotlight while the call is still running (+15% to +25%). */
export async function tryAutopostMemberStillRunning(call: {
  id: string;
  is_fueled?: boolean;
  return_pct: number | null;
}): Promise<void> {
  if (call.is_fueled) return;
  if (!stillRunningEnabled()) return;

  const ret = call.return_pct;
  const min = stillRunningMinPct();
  if (ret == null || ret < min || ret >= 25) return;

  const config = getXConfig();
  if (!config.enabled) return;

  const parentTweetId = await getSocialPostTweetId("member_win", call.id);
  if (!parentTweetId) return;

  const refId = `member_win_update-${call.id}-still_running`;
  if (await hasSocialPostBeenSent("member_win_update", refId)) return;

  const composed = await composeMemberWinUpdatePost(call.id, "still_running");
  if (!composed.ok) return;

  let mediaIds: string[] | undefined;
  const chartPayload = await loadSocialChartPayload(call.id, null, { memberWin: true });
  if (!("error" in chartPayload)) {
    try {
      const png = await renderSocialChartPng(chartPayload);
      if (!config.dryRun && config.bearerToken) {
        const uploaded = await uploadXMedia(png);
        if (uploaded.ok) mediaIds = [uploaded.mediaId];
      }
    } catch (e) {
      console.error("[x-member-win-still-running] chart", e);
    }
  }

  const posted = await postToX(composed.text, mediaIds, { quoteTweetId: parentTweetId });
  if (!posted.ok) {
    console.error("[x-member-win-still-running]", posted.error);
    return;
  }

  if (!posted.dryRun) {
    await recordSocialPost({
      postType: "member_win_update",
      refId,
      tweetId: posted.tweetId,
      parentTweetId,
      copyVariant: composed.copyVariant,
    });
  }
}
