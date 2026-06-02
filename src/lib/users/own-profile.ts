import type { SessionPayload } from "@/lib/auth/session";
import type { UserRow } from "@/lib/db/types";
import { isDemoMode } from "@/lib/demo/config";
import {
  getDemoMemberByUsername,
  getDemoMemberByUserId,
  getDemoMemberCalls,
  getDemoProfileCalls,
} from "@/lib/demo/fixtures";
import type { BillingInterval } from "@/lib/stripe/config";
import { fetchUserProfile, fetchUserRecentCalls } from "@/lib/users/profile";
import type { PublicMemberProfile } from "@/lib/users/public-profile";

function userRowToPublicMember(row: UserRow): PublicMemberProfile {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    trusted: Boolean(row.trusted_at),
    founding: false,
    calls_count: row.calls_count ?? 0,
    win_rate: row.win_rate != null ? Number(row.win_rate) : null,
    avg_return_pct:
      row.avg_return_pct != null ? Number(row.avg_return_pct) : null,
    rank_score: Number(row.rank_score ?? 0),
    created_at: row.created_at,
    last_active_at: row.last_active_at ?? null,
  };
}

/**
 * Load the signed-in member's profile (not subject to public-directory rules).
 */
export type OwnProfileResult = {
  member: PublicMemberProfile;
  calls: Awaited<ReturnType<typeof fetchUserRecentCalls>>;
  stripeCustomerId: string | null;
  subscriptionStatus: "pending" | "active" | "cancelled";
  membershipTier: "member" | "pro" | null;
  billingInterval: BillingInterval | null;
  proGrantedUntil: string | null;
};

export async function fetchOwnProfile(session: SessionPayload): Promise<
  | {
      member: null;
      calls: [];
      stripeCustomerId: null;
      subscriptionStatus: "pending";
      membershipTier: null;
      proGrantedUntil: null;
      billingInterval: null;
    }
  | OwnProfileResult
> {
  if (isDemoMode()) {
    const member =
      getDemoMemberByUserId(session.userId) ??
      getDemoMemberByUsername(session.username);

    if (member) {
      return {
        member: {
          ...member,
          founding: false,
          last_active_at: new Date().toISOString(),
        },
        calls: getDemoMemberCalls(member.id, 20),
        stripeCustomerId: null,
        subscriptionStatus: "active",
        membershipTier: "pro",
        proGrantedUntil: null,
        billingInterval: "monthly",
      };
    }

    // Logged-in user not in demo fixtures (e.g. real Supabase account + DEMO_MODE)
    const calls = getDemoProfileCalls(session.userId).slice(0, 20);
    const wins = calls.filter((c) => (c.return_pct ?? 0) > 0).length;
    return {
      member: {
        id: session.userId,
        username: session.username,
        display_name: session.displayName,
        trusted: false,
        founding: false,
        calls_count: calls.length,
        win_rate: calls.length ? Math.round((wins / calls.length) * 100) : null,
        avg_return_pct:
          calls.length > 0
            ? calls.reduce((a, c) => a + (c.return_pct ?? 0), 0) / calls.length
            : null,
        rank_score: 0,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      },
      calls,
      stripeCustomerId: null,
      subscriptionStatus: "active",
      membershipTier: "pro",
      proGrantedUntil: null,
      billingInterval: "monthly",
    };
  }

  const row = await fetchUserProfile(session.userId);
  if (!row) {
    return {
      member: null,
      calls: [],
      stripeCustomerId: null,
      subscriptionStatus: "pending",
      membershipTier: null,
      proGrantedUntil: null,
      billingInterval: null,
    };
  }

  const calls = await fetchUserRecentCalls(session.userId, 20);
  const extended = row as {
    pro_granted_until?: string | null;
    billing_interval?: BillingInterval | null;
  };

  return {
    member: userRowToPublicMember(row),
    calls,
    stripeCustomerId: row.stripe_customer_id,
    subscriptionStatus: row.subscription_status,
    membershipTier: row.membership_tier,
    billingInterval: extended.billing_interval ?? "monthly",
    proGrantedUntil: extended.pro_granted_until ?? null,
  };
}
