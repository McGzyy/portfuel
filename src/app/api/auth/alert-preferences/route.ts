import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireSession } from "@/lib/auth/session";
import {
  DEFAULT_WATCHLIST_ALERT_PREFS,
  fetchUserAlertPrefs,
  normalizeSmsPhoneE164,
  normalizeWatchlistAlertPrefs,
} from "@/lib/alerts/preferences";
import {
  DEFAULT_ENGAGEMENT_ALERT_PREFS,
  fetchEngagementAlertPrefs,
  isMissingEngagementPrefsColumn,
  normalizeEngagementAlertPrefs,
} from "@/lib/alerts/engagement-preferences";
import { fetchJournalAlertAiUsage } from "@/lib/ai/journal-alert-usage";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { isSmsConfigured } from "@/lib/sms/config";
import { canAccessProIntelligence, sessionToProContext } from "@/lib/features/pro-intelligence";
import { fetchEmailPrefs } from "@/lib/email/preferences";
import { isEmailConfigured } from "@/lib/email/config";
import { isPushConfigured } from "@/lib/push/config";
import {
  DEFAULT_CALL_EXIT_PREFS,
  fetchCallExitPrefs,
} from "@/lib/calls/call-exit-prefs";

const watchlistPrefsSchema = z.object({
  price_move: z.boolean().optional(),
  price_move_pct: z.number().min(3).max(20).optional(),
  earnings: z.boolean().optional(),
  earnings_days_ahead: z.number().min(1).max(14).optional(),
  plan_levels: z.boolean().optional(),
  community_calls: z.boolean().optional(),
  ai_insights: z.boolean().optional(),
});

const engagementPrefsSchema = z.object({
  comments_on_my_calls: z.boolean().optional(),
  votes_on_my_calls: z.boolean().optional(),
  direct_messages: z.boolean().optional(),
  followed_member_calls: z.boolean().optional(),
  call_milestones: z.boolean().optional(),
  desk_portfolio_updates: z.boolean().optional(),
  new_followers: z.boolean().optional(),
});

const callExitPrefsSchema = z.object({
  autoCloseOnStop: z.boolean().optional(),
  autoCloseOnTarget: z.boolean().optional(),
});

const patchSchema = z.object({
  watchlist: watchlistPrefsSchema.optional(),
  engagement: engagementPrefsSchema.optional(),
  callExit: callExitPrefsSchema.optional(),
  smsPhoneE164: z.union([z.string().max(20), z.literal("")]).optional(),
  smsAlertsEnabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const prefs = await fetchUserAlertPrefs(session.userId);
    if (!prefs) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const engagement = await fetchEngagementAlertPrefs(session.userId);
    const callExit = await fetchCallExitPrefs(session.userId);
    const emailPrefs = await fetchEmailPrefs(session.userId);
    const proContext = sessionToProContext(session);
    const isPro = canAccessProIntelligence(proContext);
    const aiUsage = await fetchJournalAlertAiUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
    });

    return NextResponse.json({
      watchlist: prefs.watchlist,
      engagement,
      callExit,
      smsPhoneE164: prefs.smsPhoneE164,
      smsAlertsEnabled: prefs.smsAlertsEnabled,
      pushAlertsEnabled: prefs.pushAlertsEnabled,
      emailInstantEnabled: emailPrefs?.emailInstantEnabled ?? true,
      notifyEmail: emailPrefs?.notifyEmail ?? null,
      isPro,
      smsConfigured: isSmsConfigured(),
      pushConfigured: isPushConfigured(),
      emailConfigured: isEmailConfigured(),
      aiConfigured: isAiCoachConfigured(),
      aiUsage,
      defaults: DEFAULT_WATCHLIST_ALERT_PREFS,
      engagementDefaults: DEFAULT_ENGAGEMENT_ALERT_PREFS,
      callExitDefaults: DEFAULT_CALL_EXIT_PREFS,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = patchSchema.parse(await request.json());
    const db = createServiceClient();
    const proContext = sessionToProContext(session);
    const isPro = canAccessProIntelligence(proContext);

    const existing = await fetchUserAlertPrefs(session.userId);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const existingEngagement = await fetchEngagementAlertPrefs(session.userId);

    const update: Record<string, unknown> = {};

    if (body.watchlist) {
      update.watchlist_alert_prefs = normalizeWatchlistAlertPrefs({
        ...existing.watchlist,
        ...body.watchlist,
      });
    }

    if (body.engagement) {
      update.engagement_alert_prefs = normalizeEngagementAlertPrefs({
        ...existingEngagement,
        ...body.engagement,
      });
    }

    if (body.callExit) {
      if (body.callExit.autoCloseOnStop !== undefined) {
        update.auto_close_on_stop = body.callExit.autoCloseOnStop;
      }
      if (body.callExit.autoCloseOnTarget !== undefined) {
        update.auto_close_on_target = body.callExit.autoCloseOnTarget;
      }
    }

    if (body.smsPhoneE164 !== undefined) {
      if (!isPro && body.smsPhoneE164.trim()) {
        return NextResponse.json({ error: "pro_required" }, { status: 403 });
      }
      update.sms_phone_e164 = normalizeSmsPhoneE164(body.smsPhoneE164);
    }

    if (body.smsAlertsEnabled !== undefined) {
      if (!isPro && body.smsAlertsEnabled) {
        return NextResponse.json({ error: "pro_required" }, { status: 403 });
      }
      update.sms_alerts_enabled = body.smsAlertsEnabled;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const { error } = await db
      .from("users")
      .update(update as never)
      .eq("id", session.userId);

    if (error) {
      if (isMissingEngagementPrefsColumn(error)) {
        return NextResponse.json(
          {
            error: "migration_required",
            message:
              "Apply supabase/migrations/20260707100000_engagement_alert_prefs.sql before saving engagement alert prefs.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    const prefs = await fetchUserAlertPrefs(session.userId);
    const engagement = await fetchEngagementAlertPrefs(session.userId);
    const callExit = await fetchCallExitPrefs(session.userId);
    const emailPrefs = await fetchEmailPrefs(session.userId);
    const aiUsage = await fetchJournalAlertAiUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
    });

    return NextResponse.json({
      watchlist: prefs?.watchlist ?? DEFAULT_WATCHLIST_ALERT_PREFS,
      engagement,
      callExit,
      smsPhoneE164: prefs?.smsPhoneE164 ?? null,
      smsAlertsEnabled: prefs?.smsAlertsEnabled ?? false,
      pushAlertsEnabled: prefs?.pushAlertsEnabled ?? false,
      emailInstantEnabled: emailPrefs?.emailInstantEnabled ?? true,
      notifyEmail: emailPrefs?.notifyEmail ?? null,
      isPro,
      smsConfigured: isSmsConfigured(),
      pushConfigured: isPushConfigured(),
      emailConfigured: isEmailConfigured(),
      aiConfigured: isAiCoachConfigured(),
      aiUsage,
      defaults: DEFAULT_WATCHLIST_ALERT_PREFS,
      engagementDefaults: DEFAULT_ENGAGEMENT_ALERT_PREFS,
      callExitDefaults: DEFAULT_CALL_EXIT_PREFS,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
