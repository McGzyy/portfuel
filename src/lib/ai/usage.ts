import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { limitForRole } from "@/lib/ai/config";
import type { MembershipTier } from "@/lib/stripe/config";

export type AiCoachUsageStatus = {
  used: number;
  limit: number;
  remaining: number;
  periodMonth: string;
  tier: MembershipTier | null;
  configured: boolean;
};

export function currentUsagePeriod(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function fetchAiCoachUsage(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  configured: boolean;
}): Promise<AiCoachUsageStatus> {
  const limit = limitForRole(opts.membershipTier, opts.role);
  const periodMonth = currentUsagePeriod();

  if (isDemoMode()) {
    return {
      used: 0,
      limit,
      remaining: limit,
      periodMonth,
      tier: opts.membershipTier,
      configured: opts.configured,
    };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("user_ai_usage")
    .select("reviews_used")
    .eq("user_id", opts.userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const used = (data as { reviews_used: number } | null)?.reviews_used ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    periodMonth,
    tier: opts.membershipTier,
    configured: opts.configured,
  };
}

export async function consumeAiCoachReview(userId: string): Promise<number> {
  if (isDemoMode()) return 1;

  const db = createServiceClient();
  const periodMonth = currentUsagePeriod();
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("user_ai_usage")
    .select("reviews_used")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const next = ((existing as { reviews_used: number } | null)?.reviews_used ?? 0) + 1;

  const { error } = await db.from("user_ai_usage").upsert(
    {
      user_id: userId,
      period_month: periodMonth,
      reviews_used: next,
      updated_at: now,
    } as never,
    { onConflict: "user_id,period_month" }
  );

  if (error) {
    console.error("[ai/usage/consume]", error);
    throw new Error("usage_persist_failed");
  }

  return next;
}
