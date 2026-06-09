import { ANNUAL_PLAN_BY_TIER, PLAN_BY_TIER } from "@/lib/marketing/plans";
import type { BillingInterval, MembershipTier } from "@/lib/stripe/config";

type ActiveBillingUser = {
  membership_tier: MembershipTier | null;
  billing_interval?: BillingInterval | null;
};

export function monthlyRevenueForUser(user: ActiveBillingUser): number {
  const tier: MembershipTier = user.membership_tier === "pro" ? "pro" : "member";
  const interval: BillingInterval = user.billing_interval === "annual" ? "annual" : "monthly";
  if (interval === "annual") {
    return ANNUAL_PLAN_BY_TIER[tier].priceAmount / 12;
  }
  return PLAN_BY_TIER[tier].priceAmount;
}

export function estimatePlatformMrr(users: ActiveBillingUser[]): number {
  return users.reduce((sum, user) => sum + monthlyRevenueForUser(user), 0);
}
