export type MembershipTier = "member" | "pro";
export type BillingInterval = "monthly" | "annual";

export const MEMBERSHIP_TIERS: MembershipTier[] = ["member", "pro"];
export const BILLING_INTERVALS: BillingInterval[] = ["monthly", "annual"];

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_") &&
      process.env.STRIPE_PRICE_MEMBER?.startsWith("price_") &&
      process.env.STRIPE_PRICE_PRO?.startsWith("price_")
  );
}

/** UI toggle — annual checkout hidden until you opt in. */
export function isAnnualBillingUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANNUAL_BILLING_ENABLED === "true";
}

/** Both annual Member and Pro price IDs set in env. */
export function isAnnualBillingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_PRICE_MEMBER_ANNUAL?.startsWith("price_") &&
      process.env.STRIPE_PRICE_PRO_ANNUAL?.startsWith("price_")
  );
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getPriceIdForTier(
  tier: MembershipTier,
  interval: BillingInterval = "monthly"
): string | null {
  if (interval === "annual") {
    if (tier === "member") return process.env.STRIPE_PRICE_MEMBER_ANNUAL ?? null;
    if (tier === "pro") return process.env.STRIPE_PRICE_PRO_ANNUAL ?? null;
    return null;
  }
  if (tier === "member") return process.env.STRIPE_PRICE_MEMBER ?? null;
  if (tier === "pro") return process.env.STRIPE_PRICE_PRO ?? null;
  return null;
}

const MEMBER_PRICE_IDS = () =>
  [process.env.STRIPE_PRICE_MEMBER, process.env.STRIPE_PRICE_MEMBER_ANNUAL].filter(Boolean);
const PRO_PRICE_IDS = () =>
  [process.env.STRIPE_PRICE_PRO, process.env.STRIPE_PRICE_PRO_ANNUAL].filter(Boolean);

export function tierFromPriceId(priceId: string | null | undefined): MembershipTier | null {
  if (!priceId) return null;
  if (MEMBER_PRICE_IDS().includes(priceId)) return "member";
  if (PRO_PRICE_IDS().includes(priceId)) return "pro";
  return null;
}

export function billingIntervalFromPriceId(
  priceId: string | null | undefined
): BillingInterval {
  if (!priceId) return "monthly";
  if (
    priceId === process.env.STRIPE_PRICE_MEMBER_ANNUAL ||
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL
  ) {
    return "annual";
  }
  return "monthly";
}

export function quotaForTier(tier: MembershipTier): number {
  return tier === "pro" ? 6 : 2;
}
