import { getStripe } from "@/lib/stripe/client";
import { getPriceIdForTier } from "@/lib/stripe/config";
import {
  applySubscriptionToUser,
  findUserById,
  tierFromStripeSubscription,
} from "@/lib/stripe/subscription";

export async function upgradeMemberToPro(
  userId: string,
  opts?: { prorationDate?: number }
) {
  const user = await findUserById(userId);
  if (!user) throw new Error("user_not_found");

  if (user.subscription_status !== "active") {
    throw new Error("subscription_inactive");
  }

  if (user.membership_tier === "pro") {
    throw new Error("already_pro");
  }

  if (!user.stripe_subscription_id || !user.stripe_customer_id) {
    throw new Error("no_stripe_subscription");
  }

  const proPriceId = getPriceIdForTier("pro");
  if (!proPriceId) throw new Error("price_not_configured");

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
  const item = sub.items.data[0];
  if (!item?.id) throw new Error("subscription_item_missing");

  const updated = await stripe.subscriptions.update(user.stripe_subscription_id, {
    items: [{ id: item.id, price: proPriceId }],
    proration_behavior: "create_prorations",
    ...(opts?.prorationDate != null ? { proration_date: opts.prorationDate } : {}),
    metadata: {
      ...sub.metadata,
      userId,
      tier: "pro",
    },
  });

  const tier = tierFromStripeSubscription(updated) ?? "pro";

  await applySubscriptionToUser({
    userId,
    stripeCustomerId: user.stripe_customer_id,
    stripeSubscriptionId: updated.id,
    tier,
    status: "active",
  });

  return { tier };
}
