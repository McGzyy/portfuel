import { isProGrantActive } from "@/lib/billing/effective-access";

export type MemberBillingSource = "stripe" | "trial" | "comp" | "none";

export function memberBillingSource(row: {
  subscription_status: string;
  stripe_customer_id: string | null;
  membership_tier: string | null;
  pro_granted_until?: string | null;
}): MemberBillingSource {
  if (row.subscription_status !== "active") return "none";
  if (row.stripe_customer_id) return "stripe";
  if (isProGrantActive(row.pro_granted_until)) return "trial";
  if (row.membership_tier) return "comp";
  return "none";
}

export function memberBillingSourceLabel(source: MemberBillingSource): string {
  switch (source) {
    case "stripe":
      return "Stripe";
    case "trial":
      return "Trial grant";
    case "comp":
      return "Comp";
    default:
      return "";
  }
}
