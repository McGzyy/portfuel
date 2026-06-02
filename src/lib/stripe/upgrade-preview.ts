import { getStripe } from "@/lib/stripe/client";
import {
  billingIntervalFromPriceId,
  getPriceIdForTier,
  type BillingInterval,
} from "@/lib/stripe/config";
import { findUserById } from "@/lib/stripe/subscription";
import { isDemoMode } from "@/lib/demo/config";
import { PLAN_BY_TIER } from "@/lib/marketing/plans";

export type MemberToProUpgradePreview = {
  currency: string;
  /** Net proration lines (can be negative = credit). */
  prorationCents: number;
  /** Full preview invoice amount due (next invoice). */
  amountDueCents: number;
  proMonthlyCents: number;
  currentPeriodEnd: string;
  prorationDate: number;
};

function assertUpgradeEligible(user: NonNullable<Awaited<ReturnType<typeof findUserById>>>) {
  if (user.subscription_status !== "active") throw new Error("subscription_inactive");
  if (user.membership_tier === "pro") throw new Error("already_pro");
  if (!user.stripe_subscription_id || !user.stripe_customer_id) {
    throw new Error("no_stripe_subscription");
  }
}

export async function getMemberToProUpgradePreview(
  userId: string
): Promise<MemberToProUpgradePreview> {
  const user = await findUserById(userId);
  if (!user) throw new Error("user_not_found");
  assertUpgradeEligible(user);

  if (isDemoMode()) {
    const prorationCents = 4750;
    return {
      currency: "usd",
      prorationCents,
      amountDueCents: prorationCents + PLAN_BY_TIER.pro.priceAmount * 100,
      proMonthlyCents: PLAN_BY_TIER.pro.priceAmount * 100,
      currentPeriodEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
      prorationDate: Math.floor(Date.now() / 1000),
    };
  }

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id!);
  const item = sub.items.data[0];
  if (!item?.id) throw new Error("subscription_item_missing");

  const interval =
    ((user as { billing_interval?: BillingInterval }).billing_interval as BillingInterval) ??
    billingIntervalFromPriceId(item.price.id);

  const proPriceId = getPriceIdForTier("pro", interval);
  if (!proPriceId) throw new Error("price_not_configured");

  const prorationDate = Math.floor(Date.now() / 1000);

  const invoice = await stripe.invoices.createPreview({
    customer: user.stripe_customer_id!,
    subscription: sub.id,
    subscription_details: {
      items: [{ id: item.id, price: proPriceId }],
      proration_behavior: "create_prorations",
      proration_date: prorationDate,
    },
  });

  let prorationCents = 0;
  for (const line of invoice.lines?.data ?? []) {
    const parent = line.parent as
      | { subscription_item_details?: { proration?: boolean } }
      | undefined;
    if (parent?.subscription_item_details?.proration) {
      prorationCents += line.amount;
    }
  }

  const proPrice = await stripe.prices.retrieve(proPriceId);

  const periodEndUnix =
    invoice.period_end ??
    (sub as { current_period_end?: number }).current_period_end ??
    Math.floor(Date.now() / 1000) + 30 * 86400;

  return {
    currency: invoice.currency,
    prorationCents,
    amountDueCents: invoice.amount_due,
    proMonthlyCents: proPrice.unit_amount ?? PLAN_BY_TIER.pro.priceAmount * 100,
    currentPeriodEnd: new Date(periodEndUnix * 1000).toISOString(),
    prorationDate,
  };
}
