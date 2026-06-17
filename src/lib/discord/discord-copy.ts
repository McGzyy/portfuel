import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import {
  applyCopyTemplate,
  fetchSocialPostCopy,
  type SocialPostCopy,
} from "@/lib/social/copy-templates";
import { MILESTONE_HEADLINE } from "@/lib/social/milestone-headlines";

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

export function discordLineFromCopy(
  copy: SocialPostCopy,
  key:
    | "fueled"
    | "memberNew"
    | "memberSpotlight"
    | "targetHit"
    | "weeklyDigest"
    | "milestone",
  vars: Record<string, string> = {}
): string {
  const templates = {
    fueled: copy.discordFueledLine,
    memberNew: copy.discordMemberNewLine,
    memberSpotlight: copy.discordMemberSpotlightLine,
    targetHit: copy.discordTargetHitLine,
    weeklyDigest: copy.discordWeeklyDigestLine,
    milestone: copy.discordMilestoneLine,
  } as const;
  return applyCopyTemplate(templates[key], vars);
}

export function discordMilestoneLineFromCopy(
  copy: SocialPostCopy,
  milestone: CallMilestoneKey,
  symbol: string
): string {
  const headline = MILESTONE_HEADLINE[milestone];
  if (milestone === "target_reached") {
    return discordLineFromCopy(copy, "targetHit", { symbol, headline });
  }
  const pct = headline.replace("Fueled desk hit ", "");
  return discordLineFromCopy(copy, "milestone", { symbol, headline, pct });
}

export async function fueledCallDiscordContent(): Promise<string> {
  const copy = await fetchSocialPostCopy();
  return discordLineFromCopy(copy, "fueled");
}

export async function memberNewCallDiscordContent(): Promise<string> {
  const copy = await fetchSocialPostCopy();
  return discordLineFromCopy(copy, "memberNew");
}

export async function memberSpotlightDiscordContent(symbol: string): Promise<string> {
  const copy = await fetchSocialPostCopy();
  return discordLineFromCopy(copy, "memberSpotlight", { symbol });
}

export async function targetHitDiscordContent(symbol: string): Promise<string> {
  const copy = await fetchSocialPostCopy();
  return discordLineFromCopy(copy, "targetHit", { symbol });
}

export async function weeklyDigestDiscordContent(): Promise<string> {
  const copy = await fetchSocialPostCopy();
  return discordLineFromCopy(copy, "weeklyDigest");
}

export async function milestoneDiscordContent(
  milestone: CallMilestoneKey,
  symbol: string
): Promise<string> {
  const copy = await fetchSocialPostCopy();
  return discordMilestoneLineFromCopy(copy, milestone, symbol);
}
