import { isAdminCompMember } from "@/lib/billing/comp-access";
import { memberBillingSource } from "@/lib/billing/billing-source";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import { estimatePlatformMrr } from "@/lib/admin/revenue";
import { getStripe } from "@/lib/stripe/client";
import { isStripeConfigured, type BillingInterval, type MembershipTier } from "@/lib/stripe/config";

export type ActiveMemberBillingRow = {
  subscription_status: string;
  membership_tier: MembershipTier | null;
  billing_interval?: BillingInterval | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  pro_granted_until?: string | null;
  comp_access_until?: string | null;
};

export type PlatformBillingBreakdown = {
  mrrUsd: number;
  arrUsd: number;
  mrrSource: "stripe" | "estimated" | "none";
  stripeSubscriptionCount: number | null;
  effectiveMember: number;
  effectivePro: number;
  paidStripe: number;
  paidStripeMember: number;
  paidStripePro: number;
  paidMonthly: number;
  paidAnnual: number;
  compExempt: number;
  compMember: number;
  compPro: number;
  proTrial: number;
  compOpenEnded: number;
};

function classifyBillingSource(row: ActiveMemberBillingRow): "stripe" | "trial" | "comp" | "none" {
  return memberBillingSource(row);
}

export function buildPlatformBillingBreakdown(
  members: ActiveMemberBillingRow[],
  stripeMrr: { mrrUsd: number; subscriptionCount: number } | null
): PlatformBillingBreakdown {
  const active = members.filter((m) => m.subscription_status === "active");

  let effectiveMember = 0;
  let effectivePro = 0;
  let paidStripe = 0;
  let paidStripeMember = 0;
  let paidStripePro = 0;
  let paidMonthly = 0;
  let paidAnnual = 0;
  let compExempt = 0;
  let compMember = 0;
  let compPro = 0;
  let proTrial = 0;
  let compOpenEnded = 0;

  const stripePaying: ActiveMemberBillingRow[] = [];

  for (const row of active) {
    const effective = effectiveMembershipTier(row.membership_tier, row.pro_granted_until);
    if (effective === "pro") effectivePro += 1;
    else if (effective === "member") effectiveMember += 1;

    const source = classifyBillingSource(row);

    if (source === "stripe") {
      paidStripe += 1;
      stripePaying.push(row);
      const stored = row.membership_tier === "pro" ? "pro" : "member";
      if (stored === "pro") paidStripePro += 1;
      else paidStripeMember += 1;
      if (row.billing_interval === "annual") paidAnnual += 1;
      else paidMonthly += 1;
    } else if (source === "trial") {
      proTrial += 1;
    } else if (source === "comp" && isAdminCompMember(row)) {
      compExempt += 1;
      if (row.membership_tier === "pro") compPro += 1;
      else compMember += 1;
      if (!row.comp_access_until) compOpenEnded += 1;
    }
  }

  let mrrUsd = 0;
  let mrrSource: PlatformBillingBreakdown["mrrSource"] = "none";

  if (stripeMrr && stripeMrr.subscriptionCount > 0) {
    mrrUsd = stripeMrr.mrrUsd;
    mrrSource = "stripe";
  } else if (stripePaying.length > 0) {
    mrrUsd = estimatePlatformMrr(
      stripePaying.map((u) => ({
        membership_tier: (u.membership_tier ?? "member") as MembershipTier,
        billing_interval: u.billing_interval,
      }))
    );
    mrrSource = "estimated";
  }

  return {
    mrrUsd,
    arrUsd: mrrUsd * 12,
    mrrSource,
    stripeSubscriptionCount: stripeMrr?.subscriptionCount ?? null,
    effectiveMember,
    effectivePro,
    paidStripe,
    paidStripeMember,
    paidStripePro,
    paidMonthly,
    paidAnnual,
    compExempt,
    compMember,
    compPro,
    proTrial,
    compOpenEnded,
  };
}

/** Sum normalized MRR from all active Stripe subscriptions. */
export async function fetchStripeActiveMrr(): Promise<{
  mrrUsd: number;
  subscriptionCount: number;
} | null> {
  if (!isStripeConfigured()) return null;

  try {
    const stripe = getStripe();
    let mrrCents = 0;
    let subscriptionCount = 0;
    let startingAfter: string | undefined;

    do {
      const page = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.items.data.price"],
      });

      for (const sub of page.data) {
        subscriptionCount += 1;
        for (const item of sub.items.data) {
          const price = item.price;
          if (!price?.recurring || price.unit_amount == null) continue;
          const amount = price.unit_amount * (item.quantity ?? 1);
          if (price.recurring.interval === "year") {
            mrrCents += Math.round(amount / 12);
          } else if (price.recurring.interval === "month") {
            mrrCents += amount;
          }
        }
      }

      startingAfter =
        page.has_more && page.data.length > 0
          ? page.data[page.data.length - 1]?.id
          : undefined;
    } while (startingAfter);

    return { mrrUsd: mrrCents / 100, subscriptionCount };
  } catch (e) {
    console.error("[admin/billing-breakdown/stripe]", e);
    return null;
  }
}
