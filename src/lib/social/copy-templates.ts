import { createServiceClient } from "@/lib/db/supabase";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";
import { MILESTONE_HEADLINE } from "@/lib/social/milestone-headlines";
import type { SocialPostCopyVariantId } from "@/lib/social/copy-variant";

export type { SocialPostCopyVariantId } from "@/lib/social/copy-variant";

export type SocialPostCopy = {
  milestoneLeadTemplate: string;
  milestoneTailTemplate: string;
  fueledTemplate: string;
  leaderboardTemplate: string;
  memberWinTemplate: string;
  memberWinUpdateTemplate: string;
  weeklyDigestTemplate: string;
  disclaimer: string;
  discordFueledLine: string;
  discordMemberNewLine: string;
  discordMemberSpotlightLine: string;
  discordTargetHitLine: string;
  discordWeeklyDigestLine: string;
  discordMilestoneLine: string;
  updatedAt: string | null;
};

export const DEFAULT_SOCIAL_POST_COPY: SocialPostCopy = {
  milestoneLeadTemplate: `{{headline}} · {{symbol}} {{direction}}
{{return_line}}`,
  milestoneTailTemplate: `{{link}}
{{disclaimer}}`,
  fueledTemplate: `Fueled desk · {{symbol}} {{direction}}
{{thesis}}
{{link}}
{{disclaimer}}`,
  leaderboardTemplate: `PortFuel rankings
{{leaderboard_lines}}
{{link}}
{{disclaimer}}`,
  memberWinTemplate: `PortFuel · Member call on record
{{symbol}} {{direction}} · {{return_line}}
{{member_handle}}
{{thesis_block}}{{referral_line}}{{link}}
{{disclaimer}}`,
  memberWinUpdateTemplate: `PortFuel · Update on record
{{symbol}} {{direction}} · {{headline}}
{{return_line}}
{{link}}
{{disclaimer}}`,
  weeklyDigestTemplate: `PortFuel · Community performance this week
{{digest_lines}}
{{link}}
{{disclaimer}}`,
  disclaimer: "Not investment advice.",
  discordFueledLine: "🔥 **Official desk call** · _Fueled thesis_",
  discordMemberNewLine: "📣 **New member call** · _Timestamped on PortFuel_",
  discordMemberSpotlightLine: "⭐ **Member spotlight** · **{{symbol}}** on record",
  discordTargetHitLine: "🎯 **Target reached** · **{{symbol}}**",
  discordWeeklyDigestLine: "📊 **Weekly digest** · PortFuel · Community performance this week",
  discordMilestoneLine: "📈 **{{pct}} milestone** · **{{symbol}}**",
  updatedAt: null,
};

export { MILESTONE_HEADLINE } from "@/lib/social/milestone-headlines";

export const COPY_PLACEHOLDER_HELP = [
  "{{headline}} — milestone headline (+10%, +25%, target)",
  "{{symbol}} — ticker",
  "{{direction}} — long or short",
  "{{return_line}} — e.g. +27.8% since desk call (empty if N/A)",
  "{{return_pct}} — raw return like +27.8%",
  "{{thesis}} — call thesis (Fueled posts)",
  "{{leaderboard_lines}} — numbered rankings (leaderboard posts)",
  "{{link}} — tracked PortFuel URL",
  "{{disclaimer}} — legal line from settings",
  "{{member_handle}} — @username or display name (member wins)",
  "{{thesis_block}} — thesis excerpt or empty (member wins)",
  "{{referral_line}} — member join link when referral code set (member wins)",
  "{{digest_lines}} — numbered weekly wins (weekly digest)",
] as const;

export const DISCORD_COPY_PLACEHOLDER_HELP = [
  "{{symbol}} — ticker",
  "{{headline}} — milestone headline (target hit)",
  "{{pct}} — milestone percent label (e.g. +25%)",
] as const;

function trimTweet(text: string, max = 280): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function applyCopyTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

export function composeMilestonePostText(
  copy: SocialPostCopy,
  vars: {
    milestone: CallMilestoneKey;
    symbol: string;
    direction: string;
    returnPct: number | null;
    link: string;
  }
): { lead: string; tail: string; text: string } {
  const headline = MILESTONE_HEADLINE[vars.milestone];
  const returnPct =
    vars.returnPct != null
      ? `${vars.returnPct >= 0 ? "+" : ""}${vars.returnPct.toFixed(1)}%`
      : "";
  const returnLine = returnPct ? `${returnPct} since desk call` : "";

  const templateVars = {
    headline,
    symbol: vars.symbol,
    direction: vars.direction,
    return_pct: returnPct,
    return_line: returnLine,
    link: vars.link,
    disclaimer: copy.disclaimer,
  };

  const lead = applyCopyTemplate(copy.milestoneLeadTemplate, templateVars);
  const tail = applyCopyTemplate(copy.milestoneTailTemplate, templateVars);
  const text = trimTweet([lead, tail].filter(Boolean).join("\n"));
  return { lead, tail, text };
}

export async function fetchSocialPostCopy(
  variantId: SocialPostCopyVariantId = "default"
): Promise<SocialPostCopy> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("social_post_copy")
      .select(
        "milestone_lead_template, milestone_tail_template, fueled_template, leaderboard_template, member_win_template, member_win_update_template, weekly_digest_template, disclaimer, discord_fueled_line, discord_member_new_line, discord_member_spotlight_line, discord_target_hit_line, discord_weekly_digest_line, discord_milestone_line, updated_at"
      )
      .eq("id", variantId)
      .maybeSingle();

    if (error || !data) return DEFAULT_SOCIAL_POST_COPY;

    const row = data as {
      milestone_lead_template: string;
      milestone_tail_template: string;
      fueled_template: string;
      leaderboard_template: string;
      member_win_template: string | null;
      member_win_update_template: string | null;
      weekly_digest_template: string | null;
      disclaimer: string;
      discord_fueled_line: string | null;
      discord_member_new_line: string | null;
      discord_member_spotlight_line: string | null;
      discord_target_hit_line: string | null;
      discord_weekly_digest_line: string | null;
      discord_milestone_line: string | null;
      updated_at: string;
    };

    return {
      milestoneLeadTemplate: row.milestone_lead_template,
      milestoneTailTemplate: row.milestone_tail_template,
      fueledTemplate: row.fueled_template,
      leaderboardTemplate: row.leaderboard_template,
      memberWinTemplate:
        row.member_win_template?.trim() || DEFAULT_SOCIAL_POST_COPY.memberWinTemplate,
      memberWinUpdateTemplate:
        row.member_win_update_template?.trim() ||
        DEFAULT_SOCIAL_POST_COPY.memberWinUpdateTemplate,
      weeklyDigestTemplate:
        row.weekly_digest_template?.trim() ||
        DEFAULT_SOCIAL_POST_COPY.weeklyDigestTemplate,
      disclaimer: row.disclaimer,
      discordFueledLine:
        row.discord_fueled_line?.trim() || DEFAULT_SOCIAL_POST_COPY.discordFueledLine,
      discordMemberNewLine:
        row.discord_member_new_line?.trim() || DEFAULT_SOCIAL_POST_COPY.discordMemberNewLine,
      discordMemberSpotlightLine:
        row.discord_member_spotlight_line?.trim() ||
        DEFAULT_SOCIAL_POST_COPY.discordMemberSpotlightLine,
      discordTargetHitLine:
        row.discord_target_hit_line?.trim() || DEFAULT_SOCIAL_POST_COPY.discordTargetHitLine,
      discordWeeklyDigestLine:
        row.discord_weekly_digest_line?.trim() ||
        DEFAULT_SOCIAL_POST_COPY.discordWeeklyDigestLine,
      discordMilestoneLine:
        row.discord_milestone_line?.trim() || DEFAULT_SOCIAL_POST_COPY.discordMilestoneLine,
      updatedAt: row.updated_at,
    };
  } catch {
    return DEFAULT_SOCIAL_POST_COPY;
  }
}

export async function fetchAllSocialPostCopy(): Promise<
  Record<SocialPostCopyVariantId, SocialPostCopy>
> {
  const [defaultCopy, variantB] = await Promise.all([
    fetchSocialPostCopy("default"),
    fetchSocialPostCopy("variant_b"),
  ]);
  return { default: defaultCopy, variant_b: variantB };
}

export async function updateSocialPostCopy(
  variantId: SocialPostCopyVariantId,
  input: {
  milestoneLeadTemplate?: string;
  milestoneTailTemplate?: string;
  fueledTemplate?: string;
  leaderboardTemplate?: string;
  memberWinTemplate?: string;
  memberWinUpdateTemplate?: string;
  weeklyDigestTemplate?: string;
  disclaimer?: string;
  discordFueledLine?: string;
  discordMemberNewLine?: string;
  discordMemberSpotlightLine?: string;
  discordTargetHitLine?: string;
  discordWeeklyDigestLine?: string;
  discordMilestoneLine?: string;
}): Promise<{ ok: true; copy: SocialPostCopy } | { error: string }> {
  const db = createServiceClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.milestoneLeadTemplate !== undefined) {
    const v = input.milestoneLeadTemplate.trim();
    if (v.length < 4 || v.length > 400) return { error: "invalid_milestone_lead" };
    update.milestone_lead_template = v;
  }
  if (input.milestoneTailTemplate !== undefined) {
    const v = input.milestoneTailTemplate.trim();
    if (v.length < 4 || v.length > 400) return { error: "invalid_milestone_tail" };
    update.milestone_tail_template = v;
  }
  if (input.fueledTemplate !== undefined) {
    const v = input.fueledTemplate.trim();
    if (v.length < 4 || v.length > 500) return { error: "invalid_fueled" };
    update.fueled_template = v;
  }
  if (input.leaderboardTemplate !== undefined) {
    const v = input.leaderboardTemplate.trim();
    if (v.length < 4 || v.length > 500) return { error: "invalid_leaderboard" };
    update.leaderboard_template = v;
  }
  if (input.memberWinTemplate !== undefined) {
    const v = input.memberWinTemplate.trim();
    if (v.length < 4 || v.length > 500) return { error: "invalid_member_win" };
    update.member_win_template = v;
  }
  if (input.memberWinUpdateTemplate !== undefined) {
    const v = input.memberWinUpdateTemplate.trim();
    if (v.length < 4 || v.length > 500) return { error: "invalid_member_win_update" };
    update.member_win_update_template = v;
  }
  if (input.weeklyDigestTemplate !== undefined) {
    const v = input.weeklyDigestTemplate.trim();
    if (v.length < 4 || v.length > 600) return { error: "invalid_weekly_digest" };
    update.weekly_digest_template = v;
  }
  if (input.disclaimer !== undefined) {
    const v = input.disclaimer.trim();
    if (v.length < 4 || v.length > 120) return { error: "invalid_disclaimer" };
    update.disclaimer = v;
  }
  const discordLine = (
    v: string,
    max: number,
    code: string
  ): { ok: true; value: string } | { error: string } => {
    const t = v.trim();
    if (t.length < 4 || t.length > max) return { error: code };
    return { ok: true, value: t };
  };
  if (input.discordFueledLine !== undefined) {
    const r = discordLine(input.discordFueledLine, 200, "invalid_discord_fueled");
    if ("error" in r) return { error: r.error };
    update.discord_fueled_line = r.value;
  }
  if (input.discordMemberNewLine !== undefined) {
    const r = discordLine(input.discordMemberNewLine, 200, "invalid_discord_member_new");
    if ("error" in r) return { error: r.error };
    update.discord_member_new_line = r.value;
  }
  if (input.discordMemberSpotlightLine !== undefined) {
    const r = discordLine(input.discordMemberSpotlightLine, 200, "invalid_discord_spotlight");
    if ("error" in r) return { error: r.error };
    update.discord_member_spotlight_line = r.value;
  }
  if (input.discordTargetHitLine !== undefined) {
    const r = discordLine(input.discordTargetHitLine, 200, "invalid_discord_target");
    if ("error" in r) return { error: r.error };
    update.discord_target_hit_line = r.value;
  }
  if (input.discordWeeklyDigestLine !== undefined) {
    const r = discordLine(input.discordWeeklyDigestLine, 240, "invalid_discord_digest");
    if ("error" in r) return { error: r.error };
    update.discord_weekly_digest_line = r.value;
  }
  if (input.discordMilestoneLine !== undefined) {
    const r = discordLine(input.discordMilestoneLine, 200, "invalid_discord_milestone");
    if ("error" in r) return { error: r.error };
    update.discord_milestone_line = r.value;
  }

  const { error } = await db
    .from("social_post_copy")
    .update(update as never)
    .eq("id", variantId);

  if (error) {
    console.error("[social/copy-templates/update]", error);
    return { error: "db_error" };
  }

  const copy = await fetchSocialPostCopy(variantId);
  return { ok: true, copy };
}
