import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { markDiscordRoleSyncPending } from "@/lib/discord/sync";
import { markReferralConverted } from "@/lib/referrals/service";
import {
  quotaForTier,
  tierFromPriceId,
  type MembershipTier,
} from "@/lib/stripe/config";

export type SubscriptionSyncInput = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  tier: MembershipTier;
  status: "active" | "cancelled";
};

export async function applySubscriptionToUser(input: SubscriptionSyncInput) {
  const db = createServiceClient();
  const updates: Record<string, unknown> = {
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscriptionId,
    membership_tier: input.tier,
    subscription_status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.status === "active") {
    updates.submission_quota_week = quotaForTier(input.tier);
  }

  const { error } = await db.from("users").update(updates).eq("id", input.userId);

  if (error) {
    console.error("[stripe/subscription] update failed", error);
    throw error;
  }

  if (input.status === "active") {
    await markReferralConverted(input.userId);
  }

  void markDiscordRoleSyncPending(input.userId);
}

export async function findUserByStripeCustomerId(customerId: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data as UserRow | null;
}

export async function findUserByStripeSubscriptionId(subscriptionId: string) {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  return data as UserRow | null;
}

export async function findUserById(userId: string) {
  const db = createServiceClient();
  const { data } = await db.from("users").select("*").eq("id", userId).maybeSingle();
  return data as UserRow | null;
}

export function tierFromStripeSubscription(sub: {
  items: { data: Array<{ price: { id: string } }> };
}): MembershipTier | null {
  const priceId = sub.items?.data?.[0]?.price?.id;
  return tierFromPriceId(priceId);
}

export function mapStripeSubscriptionStatus(
  status: string
): "active" | "cancelled" | "pending" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
    return "cancelled";
  }
  return "pending";
}
