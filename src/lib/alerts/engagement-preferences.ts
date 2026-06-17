import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import type { NotificationType } from "@/lib/notifications/types";

export type EngagementAlertPrefs = {
  comments_on_my_calls: boolean;
  votes_on_my_calls: boolean;
  direct_messages: boolean;
  followed_member_calls: boolean;
  call_milestones: boolean;
  desk_portfolio_updates: boolean;
  new_followers: boolean;
};

export const DEFAULT_ENGAGEMENT_ALERT_PREFS: EngagementAlertPrefs = {
  comments_on_my_calls: true,
  votes_on_my_calls: true,
  direct_messages: true,
  followed_member_calls: true,
  call_milestones: true,
  desk_portfolio_updates: true,
  new_followers: true,
};

const prefsSchema = z.object({
  comments_on_my_calls: z.boolean().optional(),
  votes_on_my_calls: z.boolean().optional(),
  direct_messages: z.boolean().optional(),
  followed_member_calls: z.boolean().optional(),
  call_milestones: z.boolean().optional(),
  desk_portfolio_updates: z.boolean().optional(),
  new_followers: z.boolean().optional(),
});

export function normalizeEngagementAlertPrefs(raw: unknown): EngagementAlertPrefs {
  const parsed = prefsSchema.safeParse(raw ?? {});
  if (!parsed.success) return { ...DEFAULT_ENGAGEMENT_ALERT_PREFS };

  return {
    comments_on_my_calls:
      parsed.data.comments_on_my_calls ?? DEFAULT_ENGAGEMENT_ALERT_PREFS.comments_on_my_calls,
    votes_on_my_calls:
      parsed.data.votes_on_my_calls ?? DEFAULT_ENGAGEMENT_ALERT_PREFS.votes_on_my_calls,
    direct_messages:
      parsed.data.direct_messages ?? DEFAULT_ENGAGEMENT_ALERT_PREFS.direct_messages,
    followed_member_calls:
      parsed.data.followed_member_calls ?? DEFAULT_ENGAGEMENT_ALERT_PREFS.followed_member_calls,
    call_milestones:
      parsed.data.call_milestones ?? DEFAULT_ENGAGEMENT_ALERT_PREFS.call_milestones,
    desk_portfolio_updates:
      parsed.data.desk_portfolio_updates ??
      DEFAULT_ENGAGEMENT_ALERT_PREFS.desk_portfolio_updates,
    new_followers:
      parsed.data.new_followers ?? DEFAULT_ENGAGEMENT_ALERT_PREFS.new_followers,
  };
}

export function isMissingEngagementPrefsColumn(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /engagement_alert_prefs/i.test(error.message ?? "")
  );
}

export async function fetchEngagementAlertPrefs(
  userId: string
): Promise<EngagementAlertPrefs> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("engagement_alert_prefs")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    if (isMissingEngagementPrefsColumn(error)) {
      console.warn(
        "[alerts] engagement_alert_prefs column missing — apply migration 20260707100000_engagement_alert_prefs.sql"
      );
    }
    return { ...DEFAULT_ENGAGEMENT_ALERT_PREFS };
  }

  return normalizeEngagementAlertPrefs(
    (data as { engagement_alert_prefs: unknown }).engagement_alert_prefs
  );
}

export type EngagementAlertKind = keyof EngagementAlertPrefs;

const TYPE_TO_ENGAGEMENT_KIND: Partial<Record<NotificationType, EngagementAlertKind>> = {
  comment_on_call: "comments_on_my_calls",
  vote_on_call: "votes_on_my_calls",
  direct_message: "direct_messages",
  followed_member_call: "followed_member_calls",
  call_milestone: "call_milestones",
  desk_portfolio_update: "desk_portfolio_updates",
  new_follower: "new_followers",
};

export function engagementKindForType(
  type: NotificationType
): EngagementAlertKind | null {
  return TYPE_TO_ENGAGEMENT_KIND[type] ?? null;
}

export function isEngagementAlertEnabled(
  prefs: EngagementAlertPrefs,
  kind: EngagementAlertKind
): boolean {
  return prefs[kind];
}
