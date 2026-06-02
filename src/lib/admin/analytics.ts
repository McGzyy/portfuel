import { buildDailySeries } from "@/lib/admin/time-series";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import type { DailyCount } from "@/lib/admin/time-series";

export type AdminAnalytics = {
  members: {
    total: number;
    active: number;
    pending: number;
    cancelled: number;
    memberTier: number;
    proTier: number;
    trusted: number;
    signups7d: number;
    signups30d: number;
    activationRate30d: number | null;
    churned30d: number;
  };
  revenue: {
    /** Estimated MRR based on active tiers (excludes admin + pending). */
    mrrUsd: number;
    arrUsd: number;
  };
  calls: {
    total: number;
    last7d: number;
    fueled: number;
    avgReturnPct: number | null;
    callsPerActiveMember7d: number | null;
  };
  engagement: {
    totalComments: number;
    totalVotes: number;
    commentsPerCall: number | null;
    votesPerCall: number | null;
  };
  topSymbols: { symbol: string; count: number }[];
  timeseries: {
    signups: DailyCount[];
    calls: DailyCount[];
  };
};

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  if (isDemoMode()) return getDemoAdminAnalytics();

  const db = createServiceClient();
  const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    usersRes,
    users7Res,
    users30Res,
    users30StatusRes,
    churn30Res,
    callsRes,
    calls7dRes,
    calls30Res,
    fueledRes,
    commentsRes,
    votesRes,
    symbolsRes,
  ] = await Promise.all([
    db.from("users").select("id, subscription_status, membership_tier, trusted_at, role"),
    db
      .from("users")
      .select("created_at")
      .gte("created_at", since7d)
      .neq("role", "admin"),
    db
      .from("users")
      .select("created_at")
      .gte("created_at", since30d)
      .neq("role", "admin"),
    db
      .from("users")
      .select("created_at, subscription_status")
      .gte("created_at", since30d)
      .neq("role", "admin"),
    db
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("subscription_status", "cancelled")
      .gte("updated_at", since30d)
      .neq("role", "admin"),
    db.from("calls").select("id, return_pct", { count: "exact", head: true }),
    db
      .from("calls")
      .select("id", { count: "exact", head: true })
      .gte("called_at", since7d),
    db.from("calls").select("called_at").gte("called_at", since30d),
    db
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("is_fueled", true),
    db.from("comments").select("id", { count: "exact", head: true }),
    db.from("call_votes").select("id", { count: "exact", head: true }),
    db.from("calls").select("symbol"),
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

  const signups7d = (users7Res.data ?? []).length;
  const signups30d = (users30Res.data ?? []).length;
  const signups30WithStatus = users30StatusRes.data ?? [];
  const act30 =
    signups30WithStatus.length > 0
      ? signups30WithStatus.filter((u) => (u as { subscription_status: string }).subscription_status === "active")
          .length / signups30WithStatus.length
      : null;

  const memberPrice = 79;
  const proPrice = 129;
  const activeMemberTier = activeMembers.filter((u) => u.membership_tier === "member").length;
  const activeProTier = activeMembers.filter((u) => u.membership_tier === "pro").length;
  const mrrUsd = activeMemberTier * memberPrice + activeProTier * proPrice;
  const arrUsd = mrrUsd * 12;

  const signupSeries = buildDailySeries(
    (users30Res.data ?? []).map((u) => (u as { created_at: string }).created_at)
  );
  const callsSeries = buildDailySeries(
    (calls30Res.data ?? []).map((c) => (c as { called_at: string }).called_at)
  );

  const calls7d = calls7dRes.count ?? 0;
  const callsPerActiveMember7d =
    activeMembers.length > 0 ? calls7d / activeMembers.length : null;

  const callsTotal = callsRes.count ?? 0;
  const commentsTotal = commentsRes.count ?? 0;
  const votesTotal = votesRes.count ?? 0;

  return {
    members: {
      total: members.length,
      active: activeMembers.length,
      pending: members.filter((u) => u.subscription_status === "pending").length,
      cancelled: members.filter((u) => u.subscription_status === "cancelled").length,
      memberTier: activeMemberTier,
      proTier: activeProTier,
      trusted: members.filter((u) => u.trusted_at).length,
      signups7d,
      signups30d,
      activationRate30d: act30,
      churned30d: churn30Res.count ?? 0,
    },
    revenue: {
      mrrUsd,
      arrUsd,
    },
    calls: {
      total: callsTotal,
      last7d: calls7d,
      fueled: fueledRes.count ?? 0,
      avgReturnPct,
      callsPerActiveMember7d,
    },
    engagement: {
      totalComments: commentsTotal,
      totalVotes: votesTotal,
      commentsPerCall: callsTotal > 0 ? commentsTotal / callsTotal : null,
      votesPerCall: callsTotal > 0 ? votesTotal / callsTotal : null,
    },
    topSymbols,
    timeseries: {
      signups: signupSeries,
      calls: callsSeries,
    },
  };
}

function getDemoAdminAnalytics(): AdminAnalytics {
  return {
    members: {
      total: 6,
      active: 5,
      pending: 1,
      cancelled: 0,
      memberTier: 3,
      proTier: 2,
      trusted: 3,
      signups7d: 3,
      signups30d: 6,
      activationRate30d: 0.83,
      churned30d: 1,
    },
    revenue: {
      mrrUsd: 3 * 79 + 2 * 129,
      arrUsd: (3 * 79 + 2 * 129) * 12,
    },
    calls: {
      total: 15,
      last7d: 11,
      fueled: 3,
      avgReturnPct: 6.42,
      callsPerActiveMember7d: 11 / 5,
    },
    engagement: {
      totalComments: 12,
      totalVotes: 48,
      commentsPerCall: 12 / 15,
      votesPerCall: 48 / 15,
    },
    timeseries: {
      signups: buildDailySeries(
        Array.from({ length: 8 }, (_, i) =>
          new Date(Date.now() - (7 - i) * 86400000).toISOString()
        )
      ),
      calls: buildDailySeries(
        Array.from({ length: 12 }, (_, i) =>
          new Date(Date.now() - (11 - i) * 86400000 * 0.8).toISOString()
        )
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
  };
}
