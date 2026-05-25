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
  };
  calls: {
    total: number;
    last7d: number;
    fueled: number;
    avgReturnPct: number | null;
  };
  engagement: {
    totalComments: number;
    totalVotes: number;
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
    users30Res,
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
      .gte("created_at", since30d)
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

  const signupSeries = buildDailySeries(
    (users30Res.data ?? []).map((u) => (u as { created_at: string }).created_at)
  );
  const callsSeries = buildDailySeries(
    (calls30Res.data ?? []).map((c) => (c as { called_at: string }).called_at)
  );

  return {
    members: {
      total: members.length,
      active: members.filter((u) => u.subscription_status === "active").length,
      pending: members.filter((u) => u.subscription_status === "pending").length,
      cancelled: members.filter((u) => u.subscription_status === "cancelled").length,
      memberTier: members.filter(
        (u) => u.subscription_status === "active" && u.membership_tier === "member"
      ).length,
      proTier: members.filter(
        (u) => u.subscription_status === "active" && u.membership_tier === "pro"
      ).length,
      trusted: members.filter((u) => u.trusted_at).length,
    },
    calls: {
      total: callsRes.count ?? 0,
      last7d: calls7dRes.count ?? 0,
      fueled: fueledRes.count ?? 0,
      avgReturnPct,
    },
    engagement: {
      totalComments: commentsRes.count ?? 0,
      totalVotes: votesRes.count ?? 0,
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
    },
    calls: {
      total: 15,
      last7d: 11,
      fueled: 3,
      avgReturnPct: 6.42,
    },
    engagement: {
      totalComments: 12,
      totalVotes: 48,
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
