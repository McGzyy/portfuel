import { createServiceClient } from "@/lib/db/supabase";
import { getStripe } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import {
  currentMonthKey,
  isReferralProgramEnabled,
  referralRewardsCapPerMonth,
  referrerRewardCents,
} from "@/lib/referrals/config";

export async function countReferrerRewardsThisMonth(referrerId: string): Promise<number> {
  const db = createServiceClient();
  const monthKey = currentMonthKey();
  const { count, error } = await db
    .from("referral_rewards")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", referrerId)
    .eq("role", "referrer")
    .eq("month_key", monthKey)
    .eq("status", "applied");

  if (error) {
    console.error("[referrals/countRewards]", error);
    return referralRewardsCapPerMonth();
  }
  return count ?? 0;
}

/** Grant referrer Stripe customer balance credit when a referred member activates. */
export async function grantReferrerRewardForConversion(
  referredUserId: string
): Promise<void> {
  if (!isReferralProgramEnabled()) return;

  const db = createServiceClient();
  const { data: referral, error: refErr } = await db
    .from("user_referrals")
    .select("id, referrer_id, referral_code")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();

  if (refErr || !referral) return;

  const referrerId = referral.referrer_id as string;
  const monthKey = currentMonthKey();
  const amountCents = referrerRewardCents();

  const { data: existing } = await db
    .from("referral_rewards")
    .select("id")
    .eq("user_referral_id", referral.id)
    .eq("role", "referrer")
    .maybeSingle();

  if (existing) return;

  const appliedThisMonth = await countReferrerRewardsThisMonth(referrerId);
  const cap = referralRewardsCapPerMonth();

  if (appliedThisMonth >= cap) {
    await db.from("referral_rewards").insert({
      referrer_id: referrerId,
      user_referral_id: referral.id,
      referred_user_id: referredUserId,
      role: "referrer",
      amount_cents: amountCents,
      reward_kind: "referrer_stripe_credit",
      status: "skipped_cap",
      month_key: monthKey,
      note: `Monthly cap (${cap}) reached`,
    } as never);
    return;
  }

  const { data: referrer } = await db
    .from("users")
    .select("stripe_customer_id, referral_credit_balance_cents")
    .eq("id", referrerId)
    .maybeSingle();

  const customerId = referrer?.stripe_customer_id as string | null | undefined;

  if (!isStripeConfigured() || !customerId) {
    await db.from("referral_rewards").insert({
      referrer_id: referrerId,
      user_referral_id: referral.id,
      referred_user_id: referredUserId,
      role: "referrer",
      amount_cents: amountCents,
      reward_kind: "referrer_stripe_credit",
      status: "skipped_no_customer",
      month_key: monthKey,
      note: "Referrer has no Stripe customer yet — credit when billing is linked",
    } as never);
    return;
  }

  let balanceTxnId: string | null = null;
  try {
    const stripe = getStripe();
    const txn = await stripe.customers.createBalanceTransaction(customerId, {
      amount: -amountCents,
      currency: "usd",
      description: "PortFuel referral reward — friend activated membership",
    });
    balanceTxnId = txn.id;
  } catch (e) {
    console.error("[referrals/stripe-credit]", e);
    await db.from("referral_rewards").insert({
      referrer_id: referrerId,
      user_referral_id: referral.id,
      referred_user_id: referredUserId,
      role: "referrer",
      amount_cents: amountCents,
      reward_kind: "referrer_stripe_credit",
      status: "pending",
      month_key: monthKey,
      note: "Stripe balance credit failed — retry manually",
    } as never);
    return;
  }

  await db.from("referral_rewards").insert({
    referrer_id: referrerId,
    user_referral_id: referral.id,
    referred_user_id: referredUserId,
    role: "referrer",
    amount_cents: amountCents,
    reward_kind: "referrer_stripe_credit",
    status: "applied",
    month_key: monthKey,
    stripe_balance_transaction_id: balanceTxnId,
  } as never);

  const priorBalance = Number(referrer?.referral_credit_balance_cents ?? 0);
  await db
    .from("users")
    .update({ referral_credit_balance_cents: priorBalance + amountCents } as never)
    .eq("id", referrerId);
}
