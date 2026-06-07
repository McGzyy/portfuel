import { getStripe } from "@/lib/stripe/client";
import {
  getAppUrl,
  getPriceIdForTier,
  type BillingInterval,
  type MembershipTier,
} from "@/lib/stripe/config";
import { findUserById } from "@/lib/stripe/subscription";

export async function createCheckoutSession(opts: {
  userId: string;
  tier: MembershipTier;
  billingInterval?: BillingInterval;
  customerEmail?: string | null;
  promotionCodeId?: string;
  voucherId?: string;
}) {
  const user = await findUserById(opts.userId);
  if (!user) throw new Error("user_not_found");

  if (user.subscription_status === "active" && user.stripe_subscription_id) {
    throw new Error("already_subscribed");
  }

  const billingInterval = opts.billingInterval ?? "monthly";
  const priceId = getPriceIdForTier(opts.tier, billingInterval);
  if (!priceId) throw new Error("price_not_configured");

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripe_customer_id ?? undefined,
    customer_email: !user.stripe_customer_id ? opts.customerEmail ?? undefined : undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/join/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/join?cancelled=1`,
    client_reference_id: opts.userId,
    metadata: {
      userId: opts.userId,
      tier: opts.tier,
      billingInterval,
      username: user.username,
      ...(opts.voucherId ? { voucherId: opts.voucherId } : {}),
    },
    subscription_data: {
      metadata: {
        userId: opts.userId,
        tier: opts.tier,
        billingInterval,
      },
    },
    ...(opts.promotionCodeId
      ? { discounts: [{ promotion_code: opts.promotionCodeId }] }
      : { allow_promotion_codes: true }),
  });

  if (!session.url) throw new Error("checkout_url_missing");
  return { url: session.url, sessionId: session.id };
}

export async function createBillingPortalSession(customerId: string) {
  const stripe = getStripe();
  const appUrl = getAppUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/settings?section=billing&billing=return`,
  });
  return session.url;
}
