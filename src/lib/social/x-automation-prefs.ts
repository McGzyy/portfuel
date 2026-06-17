import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { getXConfig } from "@/lib/social/x-config";

export type XAutomationPrefs = {
  autopostFueledOnPublish: boolean;
  autopostMilestones: boolean;
  cronFueledPosts: boolean;
  cronLeaderboardPosts: boolean;
  cronMemberWinPosts: boolean;
  cronWeeklyDigestPosts: boolean;
};

export const DEFAULT_X_AUTOMATION_PREFS: XAutomationPrefs = {
  autopostFueledOnPublish: false,
  autopostMilestones: false,
  cronFueledPosts: true,
  cronLeaderboardPosts: true,
  cronMemberWinPosts: false,
  cronWeeklyDigestPosts: false,
};

const prefsSchema = z.object({
  autopost_fueled_on_publish: z.boolean().optional(),
  autopost_milestones: z.boolean().optional(),
  cron_fueled_posts: z.boolean().optional(),
  cron_leaderboard_posts: z.boolean().optional(),
  cron_member_win_posts: z.boolean().optional(),
  cron_weekly_digest_posts: z.boolean().optional(),
});

export function normalizeXAutomationPrefs(raw: unknown): XAutomationPrefs {
  const parsed = prefsSchema.safeParse(raw ?? {});
  if (!parsed.success) return { ...DEFAULT_X_AUTOMATION_PREFS };

  return {
    autopostFueledOnPublish:
      parsed.data.autopost_fueled_on_publish ??
      DEFAULT_X_AUTOMATION_PREFS.autopostFueledOnPublish,
    autopostMilestones:
      parsed.data.autopost_milestones ?? DEFAULT_X_AUTOMATION_PREFS.autopostMilestones,
    cronFueledPosts:
      parsed.data.cron_fueled_posts ?? DEFAULT_X_AUTOMATION_PREFS.cronFueledPosts,
    cronLeaderboardPosts:
      parsed.data.cron_leaderboard_posts ??
      DEFAULT_X_AUTOMATION_PREFS.cronLeaderboardPosts,
    cronMemberWinPosts:
      parsed.data.cron_member_win_posts ?? DEFAULT_X_AUTOMATION_PREFS.cronMemberWinPosts,
    cronWeeklyDigestPosts:
      parsed.data.cron_weekly_digest_posts ??
      DEFAULT_X_AUTOMATION_PREFS.cronWeeklyDigestPosts,
  };
}

function isMissingXAutomationColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /x_automation_prefs/i.test(error.message ?? "")
  );
}

export async function fetchXAutomationPrefsFromDb(): Promise<XAutomationPrefs | null> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("social_post_copy")
      .select("x_automation_prefs")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      if (isMissingXAutomationColumn(error)) return null;
      console.warn("[x-automation-prefs] fetch failed", error.message);
      return null;
    }

    if (!data || (data as { x_automation_prefs: unknown }).x_automation_prefs == null) {
      return null;
    }

    return normalizeXAutomationPrefs(
      (data as { x_automation_prefs: unknown }).x_automation_prefs
    );
  } catch {
    return null;
  }
}

/** Effective automation flags — DB prefs when migrated, otherwise env fallbacks. */
export async function getEffectiveXAutomation(): Promise<XAutomationPrefs> {
  const env = getXConfig();
  const db = await fetchXAutomationPrefsFromDb();
  if (db) return db;

  return {
    autopostFueledOnPublish: env.autopostFueledOnPublish,
    autopostMilestones: env.autopostMilestones,
    cronFueledPosts: env.fueledPosts,
    cronLeaderboardPosts: env.leaderboardPosts,
    cronMemberWinPosts: env.memberWinPosts,
    cronWeeklyDigestPosts: env.weeklyDigestPosts,
  };
}

export async function updateXAutomationPrefs(
  input: Partial<XAutomationPrefs>
): Promise<{ ok: true; prefs: XAutomationPrefs } | { error: string }> {
  const existing = (await fetchXAutomationPrefsFromDb()) ?? { ...DEFAULT_X_AUTOMATION_PREFS };
  const next: XAutomationPrefs = {
    autopostFueledOnPublish:
      input.autopostFueledOnPublish ?? existing.autopostFueledOnPublish,
    autopostMilestones: input.autopostMilestones ?? existing.autopostMilestones,
    cronFueledPosts: input.cronFueledPosts ?? existing.cronFueledPosts,
    cronLeaderboardPosts: input.cronLeaderboardPosts ?? existing.cronLeaderboardPosts,
    cronMemberWinPosts: input.cronMemberWinPosts ?? existing.cronMemberWinPosts,
    cronWeeklyDigestPosts: input.cronWeeklyDigestPosts ?? existing.cronWeeklyDigestPosts,
  };

  const db = createServiceClient();
  const { error } = await db
    .from("social_post_copy")
    .update({
      x_automation_prefs: {
        autopost_fueled_on_publish: next.autopostFueledOnPublish,
        autopost_milestones: next.autopostMilestones,
        cron_fueled_posts: next.cronFueledPosts,
        cron_leaderboard_posts: next.cronLeaderboardPosts,
        cron_member_win_posts: next.cronMemberWinPosts,
        cron_weekly_digest_posts: next.cronWeeklyDigestPosts,
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", "default");

  if (error) {
    if (isMissingXAutomationColumn(error)) return { error: "migration_required" };
    console.error("[x-automation-prefs/update]", error);
    return { error: "db_error" };
  }

  return { ok: true, prefs: next };
}
