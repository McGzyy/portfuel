import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { loadSocialChartPayload } from "@/lib/charts/social-chart-data";
import { renderSocialChartPng } from "@/lib/charts/social-chart-render";
import { composeFueledMilestonePost } from "@/lib/social/x-compose";
import { getXConfig } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { uploadXMedia } from "@/lib/social/x-media";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";

function milestonesAutopostEnabled(): boolean {
  const raw = process.env.X_AUTOPOST_MILESTONES?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  return true;
}

/** Auto-post Fueled call milestones to X with chart image (same as admin social post). */
export async function tryAutopostFueledMilestone(
  callId: string,
  milestone: CallMilestoneKey
): Promise<void> {
  const config = getXConfig();
  if (!config.enabled || !milestonesAutopostEnabled()) return;

  const composed = await composeFueledMilestonePost(callId, milestone);
  if (!composed.ok) return;

  const already = await hasSocialPostBeenSent("fueled_milestone", composed.refId);
  if (already) return;

  let mediaIds: string[] | undefined;
  if (composed.withChart) {
    const chartPayload = await loadSocialChartPayload(callId, milestone);
    if (!("error" in chartPayload)) {
      try {
        const png = await renderSocialChartPng(chartPayload);
        const uploaded = await uploadXMedia(png);
        if (uploaded.ok) {
          mediaIds = [uploaded.mediaId];
        } else {
          console.error("[x-milestone-autopost] chart upload", uploaded.error);
        }
      } catch (e) {
        console.error("[x-milestone-autopost] chart render", e);
      }
    }
  }

  const posted = await postToX(composed.text, mediaIds);
  if (!posted.ok) {
    console.error("[x-milestone-autopost]", posted.error);
    return;
  }

  if (!posted.dryRun) {
    await recordSocialPost({
      postType: "fueled_milestone",
      refId: composed.refId,
      tweetId: posted.tweetId,
    });
  }
}
