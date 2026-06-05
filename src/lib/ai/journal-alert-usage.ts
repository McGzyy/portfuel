import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { journalAlertLimitForRole } from "@/lib/ai/config";
import { currentUsagePeriod } from "@/lib/ai/usage";
import type { MembershipTier } from "@/lib/stripe/config";

export type JournalAlertAiUsage = {
  used: number;
  limit: number;
  remaining: number;
  periodMonth: string;
};

export async function fetchJournalAlertAiUsage(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
}): Promise<JournalAlertAiUsage> {
  const limit = journalAlertLimitForRole(opts.membershipTier, opts.role);
  const periodMonth = currentUsagePeriod();

  if (isDemoMode()) {
    return { used: 0, limit, remaining: limit, periodMonth };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("user_ai_usage")
    .select("journal_alerts_used, reviews_used, summaries_used")
    .eq("user_id", opts.userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const row = data as {
    journal_alerts_used: number;
    reviews_used: number;
    summaries_used: number;
  } | null;
  const used = row?.journal_alerts_used ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    periodMonth,
  };
}

export async function consumeJournalAlertAi(userId: string): Promise<number> {
  if (isDemoMode()) return 1;

  const db = createServiceClient();
  const periodMonth = currentUsagePeriod();
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("user_ai_usage")
    .select("journal_alerts_used, reviews_used, summaries_used")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const row = existing as {
    journal_alerts_used: number;
    reviews_used: number;
    summaries_used: number;
  } | null;
  const next = (row?.journal_alerts_used ?? 0) + 1;

  const { error } = await db.from("user_ai_usage").upsert(
    {
      user_id: userId,
      period_month: periodMonth,
      journal_alerts_used: next,
      reviews_used: row?.reviews_used ?? 0,
      summaries_used: row?.summaries_used ?? 0,
      updated_at: now,
    } as never,
    { onConflict: "user_id,period_month" }
  );

  if (error) {
    console.error("[ai/journal-alert-usage/consume]", error);
    throw new Error("usage_persist_failed");
  }

  return next;
}
