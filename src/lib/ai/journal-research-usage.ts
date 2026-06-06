import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { journalResearchLimitForRole } from "@/lib/ai/config";
import { currentUsagePeriod } from "@/lib/ai/usage";
import type { MembershipTier } from "@/lib/stripe/config";

export type JournalResearchUsageStatus = {
  used: number;
  limit: number;
  remaining: number;
  periodMonth: string;
  configured: boolean;
};

export async function fetchJournalResearchUsage(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  configured: boolean;
}): Promise<JournalResearchUsageStatus> {
  const limit = journalResearchLimitForRole(opts.membershipTier, opts.role);
  const periodMonth = currentUsagePeriod();

  if (isDemoMode()) {
    return { used: 0, limit, remaining: limit, periodMonth, configured: opts.configured };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("user_ai_usage")
    .select("journal_research_used")
    .eq("user_id", opts.userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const used = (data as { journal_research_used: number } | null)?.journal_research_used ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    periodMonth,
    configured: opts.configured,
  };
}

export async function consumeJournalResearch(userId: string): Promise<number> {
  if (isDemoMode()) return 1;

  const db = createServiceClient();
  const periodMonth = currentUsagePeriod();
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("user_ai_usage")
    .select(
      "journal_research_used, journal_alerts_used, reviews_used, summaries_used"
    )
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const row = existing as {
    journal_research_used: number;
    journal_alerts_used: number;
    reviews_used: number;
    summaries_used: number;
  } | null;
  const next = (row?.journal_research_used ?? 0) + 1;

  const { error } = await db.from("user_ai_usage").upsert(
    {
      user_id: userId,
      period_month: periodMonth,
      journal_research_used: next,
      journal_alerts_used: row?.journal_alerts_used ?? 0,
      reviews_used: row?.reviews_used ?? 0,
      summaries_used: row?.summaries_used ?? 0,
      updated_at: now,
    } as never,
    { onConflict: "user_id,period_month" }
  );

  if (error) {
    console.error("[ai/journal-research-usage/consume]", error);
    throw new Error("usage_persist_failed");
  }

  return next;
}
