import type { CallMilestoneKey } from "@/lib/notifications/milestones";

/** Shared milestone headlines for X and Discord (client-safe). */
export const MILESTONE_HEADLINE: Record<CallMilestoneKey, string> = {
  return_10: "Fueled desk hit +10%",
  return_25: "Fueled desk hit +25%",
  return_50: "Fueled desk hit +50%",
  target_reached: "Fueled desk — target reached",
};

export function milestoneDiscordContent(key: CallMilestoneKey, symbol: string): string {
  const headline = MILESTONE_HEADLINE[key];
  if (key === "target_reached") {
    return `🎯 **${headline}** · **${symbol}**`;
  }
  const pct = headline.replace("Fueled desk hit ", "");
  return `📈 **${pct} milestone** · **${symbol}**`;
}
