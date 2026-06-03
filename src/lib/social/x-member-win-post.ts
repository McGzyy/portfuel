import { loadSocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import { composeMemberWinPost } from "@/lib/social/x-compose";
import { getXConfig } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { uploadXMedia } from "@/lib/social/x-media";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";
import { pickNextMemberWinCallId } from "@/lib/social/member-win-scan";

export async function postMemberWin(opts?: {
  callId?: string;
  dryRun?: boolean;
  force?: boolean;
  skipReadiness?: boolean;
}): Promise<
  | {
      ok: true;
      dryRun: boolean;
      text: string;
      tweetId?: string;
      callId: string;
    }
  | { ok: false; error: string; text?: string }
> {
  const config = getXConfig();
  if (!config.enabled) return { ok: false, error: "disabled" };

  const callId = opts?.callId ?? (await pickNextMemberWinCallId());
  if (!callId) return { ok: false, error: "no_content" };

  const composed = await composeMemberWinPost(callId, {
    skipReadiness: opts?.skipReadiness,
  });
  if (!composed.ok) return { ok: false, error: "no_content" };

  if (!opts?.force && !opts?.dryRun) {
    const already = await hasSocialPostBeenSent("member_win", composed.refId);
    if (already) return { ok: false, error: "already_posted", text: composed.text };
  }

  const dryRun = opts?.dryRun === true || config.dryRun || !config.bearerToken;

  let mediaIds: string[] | undefined;
  const chartPayload = await loadSocialChartPayload(callId, null, { memberWin: true });
  if (!("error" in chartPayload)) {
    try {
      const png = await renderSocialChartPng(chartPayload);
      if (!dryRun) {
        const uploaded = await uploadXMedia(png);
        if (uploaded.ok) mediaIds = [uploaded.mediaId];
        else console.error("[x-member-win-post] upload", uploaded.error);
      }
    } catch (e) {
      console.error("[x-member-win-post] chart", e);
    }
  }

  if (dryRun) {
    console.info("[x-member-win-post dry-run]", composed.text);
    return { ok: true, dryRun: true, text: composed.text, callId };
  }

  const posted = await postToX(composed.text, mediaIds);
  if (!posted.ok) return { ok: false, error: posted.error, text: composed.text };

  if (!posted.dryRun) {
    await recordSocialPost({
      postType: "member_win",
      refId: composed.refId,
      tweetId: posted.tweetId,
    });
  }

  return {
    ok: true,
    dryRun: posted.dryRun,
    text: composed.text,
    tweetId: posted.tweetId,
    callId,
  };
}
