import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { tierFromPriceId, type MembershipTier } from "@/lib/stripe/config";
import {
  applySubscriptionToUser,
  findUserById,
  findUserByStripeCustomerId,
  findUserByStripeSubscriptionId,
  mapStripeSubscriptionStatus,
  tierFromStripeSubscription,
} from "@/lib/stripe/subscription";

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return;
  }

  const userId = session.metadata?.userId ?? session.client_reference_id;
  if (!userId) {
    console.error("[stripe/webhook] checkout.session.completed missing userId");
    return;
  }

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!customerId || !subscriptionId) {
    console.error("[stripe/webhook] checkout missing customer or subscription");
    return;
  }

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const tier =
    tierFromStripeSubscription(sub) ??
    (session.metadata?.tier as MembershipTier | undefined) ??
    tierFromPriceId(sub.items.data[0]?.price.id);

  if (!tier) {
    console.error("[stripe/webhook] could not resolve tier for checkout", subscriptionId);
    return;
  }

  await applySubscriptionToUser({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    tier,
    status: "active",
  });
}

async function onSubscriptionUpdated(sub: Stripe.Subscription) {
  const user =
    (await findUserByStripeSubscriptionId(sub.id)) ??
    (typeof sub.customer === "string"
      ? await findUserByStripeCustomerId(sub.customer)
      : null);

  if (!user) return;

  const tier = tierFromStripeSubscription(sub) ?? user.membership_tier;
  if (!tier) return;

  const mapped = mapStripeSubscriptionStatus(sub.status);
  await applySubscriptionToUser({
    userId: user.id,
    stripeCustomerId:
      typeof sub.customer === "string" ? sub.customer : (sub.customer?.id ?? user.stripe_customer_id!),
    stripeSubscriptionId: sub.id,
    tier: tier as MembershipTier,
    status: mapped === "active" ? "active" : "cancelled",
  });
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const user = await findUserByStripeSubscriptionId(sub.id);
  if (!user) return;

  const tier = (user.membership_tier as MembershipTier) ?? "member";
  await applySubscriptionToUser({
    userId: user.id,
    stripeCustomerId:
      typeof sub.customer === "string" ? sub.customer : (sub.customer?.id ?? user.stripe_customer_id!),
    stripeSubscriptionId: sub.id,
    tier,
    status: "cancelled",
  });
}

/** Idempotent activation after redirect (webhook may lag). */
export async function confirmCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.mode !== "subscription") {
    throw new Error("invalid_session_mode");
  }

  const userId = session.metadata?.userId ?? session.client_reference_id;
  if (!userId) throw new Error("missing_user");

  const user = await findUserById(userId);
  if (!user) throw new Error("user_not_found");

  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    throw new Error("payment_incomplete");
  }

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subRaw = session.subscription;
  const subscriptionId =
    typeof subRaw === "string" ? subRaw : subRaw && "id" in subRaw ? subRaw.id : null;

  if (!customerId || !subscriptionId) throw new Error("missing_stripe_ids");

  const sub =
    typeof subRaw === "object" && subRaw && "items" in subRaw
      ? subRaw
      : await stripe.subscriptions.retrieve(subscriptionId);

  const tier =
    tierFromStripeSubscription(sub as Stripe.Subscription) ??
    (session.metadata?.tier as MembershipTier | undefined) ??
    tierFromPriceId((sub as Stripe.Subscription).items.data[0]?.price.id);

  if (!tier) throw new Error("unknown_tier");

  await applySubscriptionToUser({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    tier,
    status: "active",
  });

  return { user, tier };
}
