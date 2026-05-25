import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { quotaForTier, type MembershipTier } from "@/lib/stripe/config";

export type WeeklyQuotaStatus = {
  used: number;
  limit: number;
  remaining: number;
  tier: MembershipTier | null;
  tierLabel: string;
};

export async function fetchWeeklyQuotaStatus(
  userId: string,
  membershipTier: MembershipTier | null
): Promise<WeeklyQuotaStatus> {
  if (isDemoMode()) {
    const tier = membershipTier ?? "pro";
    const limit = quotaForTier(tier);
    return {
      used: 1,
      limit,
      remaining: limit - 1,
      tier,
      tierLabel: tier === "pro" ? "Pro Intelligence" : "Member",
    };
  }

  const db = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [{ count }, { data: user }] = await Promise.all([
    db
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("called_at", weekAgo),
    db.from("users").select("submission_quota_week, membership_tier").eq("id", userId).maybeSingle(),
  ]);

  const tier = (user?.membership_tier as MembershipTier | null) ?? membershipTier;
  const limit = user?.submission_quota_week ?? (tier ? quotaForTier(tier) : 2);
  const used = count ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    tier,
    tierLabel: tier === "pro" ? "Pro Intelligence" : tier === "member" ? "Member" : "Member",
  };
}
