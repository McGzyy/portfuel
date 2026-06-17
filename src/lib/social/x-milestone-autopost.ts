import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { postFueledMilestone } from "@/lib/social/x-milestone-post";
import { getEffectiveXAutomation } from "@/lib/social/x-automation-prefs";
import { getXConfig } from "@/lib/social/x-config";

/** Auto-post Fueled call milestones to X with chart image (same as admin social post). */
export async function tryAutopostFueledMilestone(
  callId: string,
  milestone: CallMilestoneKey
): Promise<void> {
  const config = getXConfig();
  const automation = await getEffectiveXAutomation();
  if (!config.enabled || !automation.autopostMilestones) return;

  const result = await postFueledMilestone({ callId, milestone });
  if (!result.ok) {
    if (result.error !== "already_posted" && result.error !== "no_content") {
      console.error("[x-milestone-autopost]", result.error, result.text);
    }
  }
}
