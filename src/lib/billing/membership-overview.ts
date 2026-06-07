import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  effectiveMembershipTier,
  isProGrantActive,
} from "@/lib/billing/effective-access";
import { formatDaysUntil, formatDurationSince, formatShortDate } from "@/lib/billing/format-tenure";
import { formatTierPriceLong } from "@/lib/marketing/plans";
import { getStripe } from "@/lib/stripe/client";
import {
  isStripeConfigured,
  quotaForTier,
  type BillingInterval,
  type MembershipTier,
} from "@/lib/stripe/config";
import { fetchFoundingMemberIds } from "@/lib/users/founding";

export type MembershipBadge =
  | "trusted"
  | "founding"
  | "pro"
  | "member"
  | "comp_pro"
  | "pro_trial"
  | "email_verified";

export type MembershipOverview = {
  effectiveTier: MembershipTier | null;
  storedTier: MembershipTier | null;
  subscriptionStatus: "pending" | "active" | "cancelled";
  billingInterval: BillingInterval | null;
  planLabel: string;
  planPrice: string | null;
  callsPerWeek: number | null;
  badges: MembershipBadge[];
  subscribedSince: string | null;
  subscribedSinceLabel: string | null;
  tierSince: string | null;
  tierSinceLabel: string | null;
  renewsOn: string | null;
  renewsInLabel: string | null;
  accessUntil: string | null;
  accessUntilLabel: string | null;
  cancelAtPeriodEnd: boolean;
  proGrantedUntil: string | null;
  proGrantDaysLeft: string | null;
  billingSource: "stripe" | "comp" | "trial" | "none";
  stripeConfigured: boolean;
};

type StripePeriod = {
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionCreated: string | null;
};

async function fetchStripePeriod(subscriptionId: string | null): Promise<StripePeriod | null> {
  if (!subscriptionId || !isStripeConfigured()) return null;
  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const periodEnd = (sub as { current_period_end?: number }).current_period_end;
    const created = (sub as { created?: number }).created;
    return {
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      subscriptionCreated: created ? new Date(created * 1000).toISOString() : null,
    };
  } catch (e) {
    console.error("[billing/overview/stripe]", e);
    return null;
  }
}

function resolveBadges(opts: {
  trusted: boolean;
  founding: boolean;
  effectiveTier: MembershipTier | null;
  subscriptionStatus: "pending" | "active" | "cancelled";
  emailVerified: boolean;
  proGrantedUntil: string | null;
  stripeCustomerId: string | null;
  storedTier: MembershipTier | null;
}): MembershipBadge[] {
  const badges: MembershipBadge[] = [];

  if (opts.subscriptionStatus === "active") {
    if (opts.effectiveTier === "pro") badges.push("pro");
    else if (opts.effectiveTier === "member") badges.push("member");
  }

  if (opts.trusted) badges.push("trusted");
  if (opts.founding) badges.push("founding");
  if (opts.emailVerified) badges.push("email_verified");

  const grantActive = isProGrantActive(opts.proGrantedUntil);
  if (grantActive && opts.storedTier !== "pro") {
    badges.push("pro_trial");
  } else if (
    opts.effectiveTier === "pro" &&
    !opts.stripeCustomerId &&
    opts.subscriptionStatus === "active"
  ) {
    badges.push("comp_pro");
  }

  return badges;
}

export async function fetchMembershipOverview(
  userId: string,
  opts?: { emailVerified?: boolean }
): Promise<MembershipOverview> {
  const stripeConfigured = isStripeConfigured();

  if (isDemoMode()) {
    const now = new Date();
    const subscribed = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString();
    const renews = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString();
    return {
      effectiveTier: "pro",
      storedTier: "pro",
      subscriptionStatus: "active",
      billingInterval: "monthly",
      planLabel: "Pro Intelligence",
      planPrice: formatTierPriceLong("pro", "monthly"),
      callsPerWeek: 6,
      badges: ["pro", "founding", "email_verified"],
      subscribedSince: subscribed,
      subscribedSinceLabel: formatDurationSince(subscribed),
      tierSince: subscribed,
      tierSinceLabel: formatDurationSince(subscribed),
      renewsOn: renews,
      renewsInLabel: formatDaysUntil(renews),
      accessUntil: null,
      accessUntilLabel: null,
      cancelAtPeriodEnd: false,
      proGrantedUntil: null,
      proGrantDaysLeft: null,
      billingSource: "stripe",
      stripeConfigured,
    };
  }

  const db = createServiceClient();
  const { data: user, error } = await db
    .from("users")
    .select(
      "trusted_at, created_at, subscription_status, membership_tier, billing_interval, stripe_customer_id, stripe_subscription_id, pro_granted_until, submission_quota_week, subscription_started_at, membership_tier_started_at, email_verified_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !user) {
    return {
      effectiveTier: null,
      storedTier: null,
      subscriptionStatus: "pending",
      billingInterval: null,
      planLabel: "No plan",
      planPrice: null,
      callsPerWeek: null,
      badges: [],
      subscribedSince: null,
      subscribedSinceLabel: null,
      tierSince: null,
      tierSinceLabel: null,
      renewsOn: null,
      renewsInLabel: null,
      accessUntil: null,
      accessUntilLabel: null,
      cancelAtPeriodEnd: false,
      proGrantedUntil: null,
      proGrantDaysLeft: null,
      billingSource: "none",
      stripeConfigured,
    };
  }

  const row = user as {
    trusted_at: string | null;
    created_at: string;
    subscription_status: "pending" | "active" | "cancelled";
    membership_tier: MembershipTier | null;
    billing_interval: BillingInterval | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    pro_granted_until: string | null;
    submission_quota_week: number | null;
    subscription_started_at: string | null;
    membership_tier_started_at: string | null;
    email_verified_at: string | null;
  };

  const foundingIds = await fetchFoundingMemberIds();
  const stripePeriod = await fetchStripePeriod(row.stripe_subscription_id);

  const effectiveTier = effectiveMembershipTier(row.membership_tier, row.pro_granted_until);
  const billingInterval = row.billing_interval ?? "monthly";
  const emailVerified = opts?.emailVerified ?? Boolean(row.email_verified_at);

  const subscribedSince =
    row.subscription_started_at ??
    stripePeriod?.subscriptionCreated ??
    (row.subscription_status === "active" ? row.created_at : null);

  const tierSince =
    row.membership_tier_started_at ??
    subscribedSince;

  const grantActive = isProGrantActive(row.pro_granted_until);
  let billingSource: MembershipOverview["billingSource"] = "none";
  if (row.stripe_customer_id) billingSource = "stripe";
  else if (grantActive) billingSource = "trial";
  else if (row.subscription_status === "active" && effectiveTier) billingSource = "comp";

  const planLabel =
    effectiveTier === "pro"
      ? "Pro Intelligence"
      : effectiveTier === "member"
        ? "Member"
        : row.subscription_status === "cancelled"
          ? "Subscription ended"
          : "No active plan";

  const planPrice =
    effectiveTier && row.subscription_status === "active"
      ? formatTierPriceLong(effectiveTier, billingInterval)
      : null;

  const callsPerWeek =
    effectiveTier && row.subscription_status === "active"
      ? row.submission_quota_week ?? quotaForTier(effectiveTier)
      : null;

  const cancelAtPeriodEnd = Boolean(stripePeriod?.cancelAtPeriodEnd);
  const periodEnd = stripePeriod?.currentPeriodEnd ?? null;

  return {
    effectiveTier,
    storedTier: row.membership_tier,
    subscriptionStatus: row.subscription_status,
    billingInterval: row.billing_interval,
    planLabel,
    planPrice,
    callsPerWeek,
    badges: resolveBadges({
      trusted: Boolean(row.trusted_at),
      founding: foundingIds.has(userId),
      effectiveTier,
      subscriptionStatus: row.subscription_status,
      emailVerified,
      proGrantedUntil: row.pro_granted_until,
      stripeCustomerId: row.stripe_customer_id,
      storedTier: row.membership_tier,
    }),
    subscribedSince,
    subscribedSinceLabel: formatDurationSince(subscribedSince),
    tierSince,
    tierSinceLabel: formatDurationSince(tierSince),
    renewsOn: cancelAtPeriodEnd ? null : periodEnd,
    renewsInLabel: cancelAtPeriodEnd ? null : formatDaysUntil(periodEnd),
    accessUntil: cancelAtPeriodEnd ? periodEnd : null,
    accessUntilLabel: cancelAtPeriodEnd ? formatDaysUntil(periodEnd) : null,
    cancelAtPeriodEnd,
    proGrantedUntil: grantActive ? row.pro_granted_until : null,
    proGrantDaysLeft: grantActive ? formatDaysUntil(row.pro_granted_until) : null,
    billingSource,
    stripeConfigured,
  };
}

export function formatOverviewDate(iso: string | null): string | null {
  return formatShortDate(iso);
}
