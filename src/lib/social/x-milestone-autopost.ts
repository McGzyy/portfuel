import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { composeFueledMilestonePost } from "@/lib/social/x-compose";
import { getXConfig } from "@/lib/social/x-config";
import { postToX } from "@/lib/social/x-client";
import { hasSocialPostBeenSent, recordSocialPost } from "@/lib/social/post-log";

function milestonesAutopostEnabled(): boolean {
  const raw = process.env.X_AUTOPOST_MILESTONES?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  return true;
}

/** Auto-post Fueled call milestones to X (text). Respects X_API_ENABLED and dry-run. */
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

  const posted = await postToX(composed.text);
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
