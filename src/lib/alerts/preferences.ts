import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";

export type WatchlistAlertPrefs = {
  price_move: boolean;
  price_move_pct: number;
  earnings: boolean;
  earnings_days_ahead: number;
  plan_levels: boolean;
  community_calls: boolean;
  ai_insights: boolean;
};

export type UserAlertPrefs = {
  watchlist: WatchlistAlertPrefs;
  smsPhoneE164: string | null;
  smsAlertsEnabled: boolean;
};

export const DEFAULT_WATCHLIST_ALERT_PREFS: WatchlistAlertPrefs = {
  price_move: true,
  price_move_pct: 5,
  earnings: true,
  earnings_days_ahead: 3,
  plan_levels: true,
  community_calls: true,
  ai_insights: true,
};

const prefsSchema = z.object({
  price_move: z.boolean().optional(),
  price_move_pct: z.number().min(3).max(20).optional(),
  earnings: z.boolean().optional(),
  earnings_days_ahead: z.number().min(1).max(14).optional(),
  plan_levels: z.boolean().optional(),
  community_calls: z.boolean().optional(),
  ai_insights: z.boolean().optional(),
});

export function normalizeWatchlistAlertPrefs(raw: unknown): WatchlistAlertPrefs {
  const parsed = prefsSchema.safeParse(raw ?? {});
  if (!parsed.success) return { ...DEFAULT_WATCHLIST_ALERT_PREFS };

  return {
    price_move: parsed.data.price_move ?? DEFAULT_WATCHLIST_ALERT_PREFS.price_move,
    price_move_pct: parsed.data.price_move_pct ?? DEFAULT_WATCHLIST_ALERT_PREFS.price_move_pct,
    earnings: parsed.data.earnings ?? DEFAULT_WATCHLIST_ALERT_PREFS.earnings,
    earnings_days_ahead:
      parsed.data.earnings_days_ahead ?? DEFAULT_WATCHLIST_ALERT_PREFS.earnings_days_ahead,
    plan_levels: parsed.data.plan_levels ?? DEFAULT_WATCHLIST_ALERT_PREFS.plan_levels,
    community_calls:
      parsed.data.community_calls ?? DEFAULT_WATCHLIST_ALERT_PREFS.community_calls,
    ai_insights: parsed.data.ai_insights ?? DEFAULT_WATCHLIST_ALERT_PREFS.ai_insights,
  };
}

const E164_RE = /^\+[1-9]\d{6,14}$/;

export function normalizeSmsPhoneE164(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const normalized = trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/\D/g, "")}`;
  return E164_RE.test(normalized) ? normalized : null;
}

export async function fetchUserAlertPrefs(userId: string): Promise<UserAlertPrefs | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("watchlist_alert_prefs, sms_phone_e164, sms_alerts_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    watchlist_alert_prefs: unknown;
    sms_phone_e164: string | null;
    sms_alerts_enabled: boolean;
  };

  return {
    watchlist: normalizeWatchlistAlertPrefs(row.watchlist_alert_prefs),
    smsPhoneE164: row.sms_phone_e164,
    smsAlertsEnabled: Boolean(row.sms_alerts_enabled),
  };
}

export function isWatchlistAlertTypeEnabled(
  prefs: WatchlistAlertPrefs,
  kind: "price_move" | "earnings" | "plan_levels" | "community_calls"
): boolean {
  return prefs[kind];
}
