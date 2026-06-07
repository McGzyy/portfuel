import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { postFueledMilestone } from "@/lib/social/x-milestone-post";
import { getXConfig } from "@/lib/social/x-config";

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

  const result = await postFueledMilestone({ callId, milestone });
  if (!result.ok) {
    if (result.error !== "already_posted" && result.error !== "no_content") {
      console.error("[x-milestone-autopost]", result.error, result.text);
    }
  }
}
