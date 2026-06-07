import { PF_CHART_SOCIAL as T } from "@/lib/charts/theme";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";

export function fmtSocialAsOf(date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function directionMeta(direction: "long" | "short"): { label: string; color: string } {
  return direction === "long"
    ? { label: "Long", color: T.lineUp }
    : { label: "Short", color: T.lineDown };
}

export function showTargetGuide(milestone: CallMilestoneKey | null): boolean {
  return milestone === "target_reached" || milestone === "return_25";
}
