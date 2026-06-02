import type { MembershipTier } from "@/lib/stripe/config";

export function isProGrantActive(proGrantedUntil: string | null | undefined): boolean {
  if (!proGrantedUntil) return false;
  return new Date(proGrantedUntil).getTime() > Date.now();
}

/** Stripe tier plus optional time-limited Pro voucher grant. */
export function effectiveMembershipTier(
  storedTier: MembershipTier | null | undefined,
  proGrantedUntil: string | null | undefined
): MembershipTier | null {
  if (isProGrantActive(proGrantedUntil)) return "pro";
  return storedTier ?? null;
}

export function effectiveHasProIntelligence(opts: {
  role: "member" | "admin";
  subscriptionStatus: "pending" | "active" | "cancelled";
  membershipTier: MembershipTier | null;
  proGrantedUntil?: string | null;
}): boolean {
  if (opts.role === "admin") return true;
  if (opts.subscriptionStatus !== "active") return false;
  const tier = effectiveMembershipTier(opts.membershipTier, opts.proGrantedUntil);
  return tier === "pro";
}
