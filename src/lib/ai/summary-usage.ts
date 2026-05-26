import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { summaryLimitForRole } from "@/lib/ai/config";
import { currentUsagePeriod } from "@/lib/ai/usage";
import type { MembershipTier } from "@/lib/stripe/config";

export type AiSummaryUsageStatus = {
  used: number;
  limit: number;
  remaining: number;
  periodMonth: string;
  canGenerate: boolean;
};

export async function fetchAiSummaryUsage(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  canGenerate: boolean;
}): Promise<AiSummaryUsageStatus> {
  const limit = summaryLimitForRole(opts.membershipTier, opts.role);
  const periodMonth = currentUsagePeriod();

  if (isDemoMode()) {
    return {
      used: 0,
      limit,
      remaining: limit,
      periodMonth,
      canGenerate: opts.canGenerate,
    };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("user_ai_usage")
    .select("summaries_used")
    .eq("user_id", opts.userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const used = (data as { summaries_used: number } | null)?.summaries_used ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    periodMonth,
    canGenerate: opts.canGenerate,
  };
}

export async function consumeAiSummaryGeneration(userId: string): Promise<number> {
  if (isDemoMode()) return 1;

  const db = createServiceClient();
  const periodMonth = currentUsagePeriod();
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("user_ai_usage")
    .select("summaries_used, reviews_used")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const row = existing as { summaries_used: number; reviews_used: number } | null;
  const next = (row?.summaries_used ?? 0) + 1;

  const { error } = await db.from("user_ai_usage").upsert(
    {
      user_id: userId,
      period_month: periodMonth,
      summaries_used: next,
      reviews_used: row?.reviews_used ?? 0,
      updated_at: now,
    } as never,
    { onConflict: "user_id,period_month" }
  );

  if (error) {
    console.error("[ai/summary-usage/consume]", error);
    throw new Error("usage_persist_failed");
  }

  return next;
}
