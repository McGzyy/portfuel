import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import {
  applyCopyTemplate,
  fetchSocialPostCopy,
  MILESTONE_HEADLINE,
} from "@/lib/social/copy-templates";

/** Discord markdown wrapper for the shared disclaimer line. */
export function formatDiscordDisclaimer(disclaimer: string): string {
  const trimmed = disclaimer.trim();
  if (!trimmed) return "_Educational content only — not investment advice._";
  if (trimmed.startsWith("_") && trimmed.endsWith("_")) return trimmed;
  return `_${trimmed}_`;
}

export async function getDiscordDisclaimerMarkdown(): Promise<string> {
  const copy = await fetchSocialPostCopy();
  return formatDiscordDisclaimer(copy.disclaimer);
}

export function milestoneDiscordContent(key: CallMilestoneKey, symbol: string): string {
  const headline = MILESTONE_HEADLINE[key];
  if (key === "target_reached") {
    return `🎯 **${headline}** · **${symbol}**`;
  }
  const pct = headline.replace("Fueled desk hit ", "");
  return `📈 **${pct} milestone** · **${symbol}**`;
}

export async function fueledCallDiscordContent(): Promise<string> {
  return "🔥 **Official desk call** · _Fueled thesis_";
}

export async function memberNewCallDiscordContent(): Promise<string> {
  return "📣 **New member call** · _Timestamped on PortFuel_";
}

export async function memberSpotlightDiscordContent(symbol: string): Promise<string> {
  return `⭐ **Member spotlight** · **${symbol}** on record`;
}

export async function targetHitDiscordContent(symbol: string): Promise<string> {
  return `🎯 **Target reached** · **${symbol}**`;
}

export async function weeklyDigestDiscordContent(): Promise<string> {
  const copy = await fetchSocialPostCopy();
  const firstLine =
    copy.weeklyDigestTemplate.split("\n").find((l) => l.trim())?.trim() ??
    "PortFuel · Community performance this week";
  return applyCopyTemplate(`📊 **Weekly digest** · ${firstLine}`, {
    digest_lines: "",
    link: "",
    disclaimer: "",
  }).replace(/\n+$/, "");
}
