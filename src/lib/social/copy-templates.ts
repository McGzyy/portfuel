import { createServiceClient } from "@/lib/db/supabase";
import type { CallMilestoneKey } from "@/lib/notifications/milestones";

const COPY_ID = "default";

export type SocialPostCopy = {
  milestoneLeadTemplate: string;
  milestoneTailTemplate: string;
  fueledTemplate: string;
  leaderboardTemplate: string;
  memberWinTemplate: string;
  disclaimer: string;
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
{{thesis_block}}{{link}}
{{disclaimer}}`,
  disclaimer: "Not investment advice.",
  updatedAt: null,
};

export const MILESTONE_HEADLINE: Record<CallMilestoneKey, string> = {
  return_10: "Fueled desk hit +10%",
  return_25: "Fueled desk hit +25%",
  target_reached: "Fueled desk — target reached",
};

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

export async function fetchSocialPostCopy(): Promise<SocialPostCopy> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("social_post_copy")
      .select(
        "milestone_lead_template, milestone_tail_template, fueled_template, leaderboard_template, member_win_template, disclaimer, updated_at"
      )
      .eq("id", COPY_ID)
      .maybeSingle();

    if (error || !data) return DEFAULT_SOCIAL_POST_COPY;

    const row = data as {
      milestone_lead_template: string;
      milestone_tail_template: string;
      fueled_template: string;
      leaderboard_template: string;
      member_win_template: string | null;
      disclaimer: string;
      updated_at: string;
    };

    return {
      milestoneLeadTemplate: row.milestone_lead_template,
      milestoneTailTemplate: row.milestone_tail_template,
      fueledTemplate: row.fueled_template,
      leaderboardTemplate: row.leaderboard_template,
      memberWinTemplate:
        row.member_win_template?.trim() || DEFAULT_SOCIAL_POST_COPY.memberWinTemplate,
      disclaimer: row.disclaimer,
      updatedAt: row.updated_at,
    };
  } catch {
    return DEFAULT_SOCIAL_POST_COPY;
  }
}

export async function updateSocialPostCopy(input: {
  milestoneLeadTemplate?: string;
  milestoneTailTemplate?: string;
  fueledTemplate?: string;
  leaderboardTemplate?: string;
  disclaimer?: string;
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
  if (input.disclaimer !== undefined) {
    const v = input.disclaimer.trim();
    if (v.length < 4 || v.length > 120) return { error: "invalid_disclaimer" };
    update.disclaimer = v;
  }

  const { error } = await db.from("social_post_copy").update(update as never).eq("id", COPY_ID);

  if (error) {
    console.error("[social/copy-templates/update]", error);
    return { error: "db_error" };
  }

  const copy = await fetchSocialPostCopy();
  return { ok: true, copy };
}
