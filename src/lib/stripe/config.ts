export type MembershipTier = "member" | "pro";

export const MEMBERSHIP_TIERS: MembershipTier[] = ["member", "pro"];

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_") &&
      process.env.STRIPE_PRICE_MEMBER?.startsWith("price_") &&
      process.env.STRIPE_PRICE_PRO?.startsWith("price_")
  );
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getPriceIdForTier(tier: MembershipTier): string | null {
  if (tier === "member") return process.env.STRIPE_PRICE_MEMBER ?? null;
  if (tier === "pro") return process.env.STRIPE_PRICE_PRO ?? null;
  return null;
}

export function tierFromPriceId(priceId: string | null | undefined): MembershipTier | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_MEMBER) return "member";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return null;
}

export function quotaForTier(tier: MembershipTier): number {
  return tier === "pro" ? 6 : 2;
}
