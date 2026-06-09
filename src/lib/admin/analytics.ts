import { buildSignupCohorts, type SignupCohortWeek } from "@/lib/admin/cohorts";
import { estimatePlatformMrr } from "@/lib/admin/revenue";
import { buildDailySeries } from "@/lib/admin/time-series";
import { cancellationReasonLabel } from "@/lib/billing/cancellation-feedback-types";
import type { CancellationFeedbackReason } from "@/lib/billing/cancellation-feedback-types";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import type { DailyCount } from "@/lib/admin/time-series";
import type { BillingInterval, MembershipTier } from "@/lib/stripe/config";

export type AdminAnalyticsPeriod = 7 | 30 | 90;

export type AdminAnalytics = {
  meta: {
    periodDays: AdminAnalyticsPeriod;
    generatedAt: string;
  };
  members: {
    total: number;
    active: number;
    pending: number;
    cancelled: number;
    memberTier: number;
    proTier: number;
    trusted: number;
    signupsPeriod: number;
    signupsPrior: number;
    activationRatePeriod: number | null;
    churnedPeriod: number;
    churnedPrior: number;
  };
  revenue: {
    /** Estimated MRR from active tiers + billing interval (monthly/annual). */
    mrrUsd: number;
    arrUsd: number;
    memberTierPct: number | null;
    proTierPct: number | null;
    monthlyBilling: number;
    annualBilling: number;
  };
  cohorts: SignupCohortWeek[];
  calls: {
    total: number;
    period: number;
    prior: number;
    fueled: number;
    avgReturnPct: number | null;
    callsPerActiveMemberPeriod: number | null;
  };
  engagement: {
    totalComments: number;
    totalVotes: number;
    commentsPerCall: number | null;
    votesPerCall: number | null;
  };
  topSymbols: { symbol: string; count: number }[];
  referrals: {
    signedUp: number;
    converted: number;
    invitesSent: number;
    conversionRate: number | null;
  };
  churn: {
    feedbackCount: number;
    reasons: { reason: CancellationFeedbackReason; label: string; count: number }[];
  };
  timeseries: {
    signups: DailyCount[];
    calls: DailyCount[];
  };
};

function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return current > 0 ? 100 : null;
  return ((current - prior) / prior) * 100;
}

export function parseAdminAnalyticsPeriod(raw: string | null): AdminAnalyticsPeriod {
  if (raw === "7") return 7;
  if (raw === "90") return 90;
  return 30;
}

export async function fetchAdminAnalytics(
  periodDays: AdminAnalyticsPeriod = 30
): Promise<AdminAnalytics> {
  if (isDemoMode()) return getDemoAdminAnalytics(periodDays);

  const db = createServiceClient();
  const now = Date.now();
  const since = new Date(now - periodDays * 86400000).toISOString();
  const priorSince = new Date(now - periodDays * 2 * 86400000).toISOString();
  const cohortSince = new Date(now - 56 * 86400000).toISOString();

  const [
    usersRes,
    usersPeriodRes,
    usersPriorRes,
    usersPeriodStatusRes,
    churnPeriodRes,
    churnPriorRes,
    callsRes,
    callsPeriodRes,
    callsPriorRes,
    callsPeriodSeriesRes,
    fueledRes,
    commentsRes,
    votesRes,
    symbolsRes,
    referralsRes,
    invitesRes,
    churnFeedbackRes,
    cohortUsersRes,
  ] = await Promise.all([
    db
      .from("users")
      .select("id, subscription_status, membership_tier, trusted_at, role, billing_interval"),
    db
      .from("users")
      .select("created_at")
      .gte("created_at", since)
      .neq("role", "admin"),
    db
      .from("users")
      .select("created_at")
      .gte("created_at", priorSince)
      .lt("created_at", since)
      .neq("role", "admin"),
    db
      .from("users")
      .select("created_at, subscription_status")
      .gte("created_at", since)
      .neq("role", "admin"),
    db
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "cancelled")
      .gte("updated_at", since)
      .neq("role", "admin"),
    db
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "cancelled")
      .gte("updated_at", priorSince)
      .lt("updated_at", since)
      .neq("role", "admin"),
    db.from("calls").select("id, return_pct", { count: "exact", head: true }),
    db
      .from("calls")
      .select("id", { count: "exact", head: true })
      .gte("called_at", since),
    db
      .from("calls")
      .select("id", { count: "exact", head: true })
      .gte("called_at", priorSince)
      .lt("called_at", since),
    db.from("calls").select("called_at").gte("called_at", since),
    db
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("is_fueled", true),
    db.from("comments").select("id", { count: "exact", head: true }),
    db.from("call_votes").select("id", { count: "exact", head: true }),
    db.from("calls").select("symbol"),
    db.from("user_referrals").select("status"),
    db.from("referral_invites").select("status"),
    db
      .from("subscription_cancellation_feedback")
      .select("reason")
      .gte("created_at", since),
    db
      .from("users")
      .select("created_at, subscription_status")
      .gte("created_at", cohortSince)
      .neq("role", "admin"),
  ]);

  const users = usersRes.data ?? [];
  const members = users.filter((u) => u.role !== "admin");
  const activeMembers = members.filter((u) => u.subscription_status === "active");

  const allCalls = symbolsRes.data ?? [];
  const symbolCounts = new Map<string, number>();
  for (const c of allCalls) {
    symbolCounts.set(c.symbol, (symbolCounts.get(c.symbol) ?? 0) + 1);
  }
  const topSymbols = [...symbolCounts.entries()]
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const { data: returnRows } = await db
    .from("calls")
    .select("return_pct")
    .not("return_pct", "is", null);
  const returns = (returnRows ?? []).map((r) => Number(r.return_pct));
  const avgReturnPct =
    returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : null;

  const signupsPeriod = (usersPeriodRes.data ?? []).length;
  const signupsPrior = (usersPriorRes.data ?? []).length;
  const signupsPeriodWithStatus = usersPeriodStatusRes.data ?? [];
  const activationRatePeriod =
    signupsPeriodWithStatus.length > 0
      ? signupsPeriodWithStatus.filter(
          (u) => (u as { subscription_status: string }).subscription_status === "active"
        ).length / signupsPeriodWithStatus.length
      : null;

  const activeMemberTier = activeMembers.filter((u) => u.membership_tier === "member").length;
  const activeProTier = activeMembers.filter((u) => u.membership_tier === "pro").length;
  const activePaid = activeMemberTier + activeProTier;
  const monthlyBilling = activeMembers.filter(
    (u) => (u as { billing_interval?: BillingInterval }).billing_interval !== "annual"
  ).length;
  const annualBilling = activeMembers.filter(
    (u) => (u as { billing_interval?: BillingInterval }).billing_interval === "annual"
  ).length;
  const mrrUsd = estimatePlatformMrr(
    activeMembers.map((u) => ({
      membership_tier: (u.membership_tier ?? "member") as MembershipTier,
      billing_interval: (u as { billing_interval?: BillingInterval }).billing_interval,
    }))
  );
  const arrUsd = mrrUsd * 12;
  const cohorts = buildSignupCohorts(cohortUsersRes.data ?? [], 8);

  const signupSeries = buildDailySeries(
    (usersPeriodRes.data ?? []).map((u) => (u as { created_at: string }).created_at),
    periodDays
  );
  const callsSeries = buildDailySeries(
    (callsPeriodSeriesRes.data ?? []).map((c) => (c as { called_at: string }).called_at),
    periodDays
  );

  const callsPeriod = callsPeriodRes.count ?? 0;
  const callsPrior = callsPriorRes.count ?? 0;
  const callsPerActiveMemberPeriod =
    activeMembers.length > 0 ? callsPeriod / activeMembers.length : null;

  const callsTotal = callsRes.count ?? 0;
  const commentsTotal = commentsRes.count ?? 0;
  const votesTotal = votesRes.count ?? 0;

  const referralRows = referralsRes.data ?? [];
  const referralSignedUp = referralRows.length;
  const referralConverted = referralRows.filter((r) => r.status === "converted").length;
  const invitesSent = (invitesRes.data ?? []).filter((r) => r.status === "sent").length;
  const referralConversionRate =
    referralSignedUp > 0 ? referralConverted / referralSignedUp : null;

  const churnReasonCounts = new Map<CancellationFeedbackReason, number>();
  for (const row of churnFeedbackRes.data ?? []) {
    const reason = (row as { reason: CancellationFeedbackReason }).reason;
    churnReasonCounts.set(reason, (churnReasonCounts.get(reason) ?? 0) + 1);
  }
  const churnReasons = [...churnReasonCounts.entries()]
    .map(([reason, count]) => ({
      reason,
      label: cancellationReasonLabel(reason),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    meta: {
      periodDays,
      generatedAt: new Date().toISOString(),
    },
    members: {
      total: members.length,
      active: activeMembers.length,
      pending: members.filter((u) => u.subscription_status === "pending").length,
      cancelled: members.filter((u) => u.subscription_status === "cancelled").length,
      memberTier: activeMemberTier,
      proTier: activeProTier,
      trusted: members.filter((u) => u.trusted_at).length,
      signupsPeriod,
      signupsPrior,
      activationRatePeriod,
      churnedPeriod: churnPeriodRes.count ?? 0,
      churnedPrior: churnPriorRes.count ?? 0,
    },
    revenue: {
      mrrUsd,
      arrUsd,
      memberTierPct: activePaid > 0 ? activeMemberTier / activePaid : null,
      proTierPct: activePaid > 0 ? activeProTier / activePaid : null,
      monthlyBilling,
      annualBilling,
    },
    cohorts,
    calls: {
      total: callsTotal,
      period: callsPeriod,
      prior: callsPrior,
      fueled: fueledRes.count ?? 0,
      avgReturnPct,
      callsPerActiveMemberPeriod,
    },
    engagement: {
      totalComments: commentsTotal,
      totalVotes: votesTotal,
      commentsPerCall: callsTotal > 0 ? commentsTotal / callsTotal : null,
      votesPerCall: callsTotal > 0 ? votesTotal / callsTotal : null,
    },
    topSymbols,
    referrals: {
      signedUp: referralSignedUp,
      converted: referralConverted,
      invitesSent,
      conversionRate: referralConversionRate,
    },
    churn: {
      feedbackCount: churnFeedbackRes.data?.length ?? 0,
      reasons: churnReasons,
    },
    timeseries: {
      signups: signupSeries,
      calls: callsSeries,
    },
  };
}

/** Period-over-period % change for analytics KPIs. */
export function adminAnalyticsDelta(current: number, prior: number): number | null {
  return pctDelta(current, prior);
}

function getDemoAdminAnalytics(periodDays: AdminAnalyticsPeriod): AdminAnalytics {
  const signupsPeriod = periodDays === 7 ? 3 : periodDays === 90 ? 18 : 6;
  const signupsPrior = periodDays === 7 ? 2 : periodDays === 90 ? 14 : 4;
  const callsPeriod = periodDays === 7 ? 11 : periodDays === 90 ? 42 : 28;
  const callsPrior = periodDays === 7 ? 8 : periodDays === 90 ? 35 : 22;

  return {
    meta: {
      periodDays,
      generatedAt: new Date().toISOString(),
    },
    members: {
      total: 6,
      active: 5,
      pending: 1,
      cancelled: 0,
      memberTier: 3,
      proTier: 2,
      trusted: 3,
      signupsPeriod,
      signupsPrior,
      activationRatePeriod: 0.83,
      churnedPeriod: 1,
      churnedPrior: 0,
    },
    revenue: {
      mrrUsd: 3 * 79 + 2 * 129,
      arrUsd: (3 * 79 + 2 * 129) * 12,
      memberTierPct: 3 / 5,
      proTierPct: 2 / 5,
      monthlyBilling: 4,
      annualBilling: 1,
    },
    cohorts: buildSignupCohorts(
      [
        { created_at: new Date(Date.now() - 6 * 86400000).toISOString(), subscription_status: "active" },
        { created_at: new Date(Date.now() - 13 * 86400000).toISOString(), subscription_status: "active" },
        { created_at: new Date(Date.now() - 20 * 86400000).toISOString(), subscription_status: "cancelled" },
        { created_at: new Date(Date.now() - 27 * 86400000).toISOString(), subscription_status: "active" },
      ],
      8
    ),
    calls: {
      total: 15,
      period: callsPeriod,
      prior: callsPrior,
      fueled: 3,
      avgReturnPct: 6.42,
      callsPerActiveMemberPeriod: callsPeriod / 5,
    },
    engagement: {
      totalComments: 12,
      totalVotes: 48,
      commentsPerCall: 12 / 15,
      votesPerCall: 48 / 15,
    },
    timeseries: {
      signups: buildDailySeries(
        Array.from({ length: Math.min(8, periodDays) }, (_, i) =>
          new Date(Date.now() - (7 - i) * 86400000).toISOString()
        ),
        periodDays
      ),
      calls: buildDailySeries(
        Array.from({ length: Math.min(12, periodDays) }, (_, i) =>
          new Date(Date.now() - (11 - i) * 86400000 * 0.8).toISOString()
        ),
        periodDays
      ),
    },
    topSymbols: [
      { symbol: "NVDA", count: 3 },
      { symbol: "BTC", count: 2 },
      { symbol: "SPY", count: 2 },
      { symbol: "AMD", count: 1 },
      { symbol: "TSLA", count: 1 },
      { symbol: "ETH", count: 1 },
      { symbol: "META", count: 1 },
      { symbol: "QQQ", count: 1 },
    ],
    referrals: {
      signedUp: 4,
      converted: 2,
      invitesSent: 6,
      conversionRate: 0.5,
    },
    churn: {
      feedbackCount: 2,
      reasons: [
        { reason: "too_expensive", label: "Too expensive", count: 1 },
        { reason: "not_using_enough", label: "Not using it enough", count: 1 },
      ],
    },
  };
}
