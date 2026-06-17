import { loadSocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import { composeFueledPostByCallId } from "@/lib/social/x-compose";
import { getXConfig } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { uploadXMedia } from "@/lib/social/x-media";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";

export function fueledPublishChartUrl(callId: string): string {
  return `/api/social/chart/${callId}?format=png`;
}

/** Auto-post a new Fueled desk call to X when X_AUTOPOST_FUELED_ON_PUBLISH is enabled. */
export async function tryAutopostFueledOnPublish(callId: string): Promise<void> {
  const config = getXConfig();
  if (!config.enabled || !config.autopostFueledOnPublish) return;

  const composed = await composeFueledPostByCallId(callId);
  if (!composed.ok) return;

  if (await hasSocialPostBeenSent("fueled", composed.refId)) return;

  const dryRun = config.dryRun || !config.bearerToken;

  const chartPayload = await loadSocialChartPayload(callId, null);
  if ("error" in chartPayload) {
    console.error("[x-fueled-autopost] chart payload", chartPayload.error);
    return;
  }

  let mediaIds: string[] | undefined;
  try {
    const png = await renderSocialChartPng(chartPayload);
    if (!dryRun) {
      const uploaded = await uploadXMedia(png);
      if (uploaded.ok) mediaIds = [uploaded.mediaId];
      else console.error("[x-fueled-autopost] upload", uploaded.error);
    }
  } catch (e) {
    console.error("[x-fueled-autopost] chart", e);
    return;
  }

  if (dryRun) {
    console.info("[x-fueled-autopost dry-run]", composed.text);
    return;
  }

  const posted = await postToX(composed.text, mediaIds);
  if (!posted.ok) {
    console.error("[x-fueled-autopost]", posted.error);
    return;
  }

  if (!posted.dryRun) {
    await recordSocialPost({
      postType: "fueled",
      refId: composed.refId,
      tweetId: posted.tweetId,
    });
  }
}
