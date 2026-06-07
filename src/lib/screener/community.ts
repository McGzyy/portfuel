import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { loadFeedCalls } from "@/lib/dashboard/data";

export type MostCalledRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  callCount: number;
  latestDirection: string;
  bestReturnPct: number | null;
};

export type TopReturnRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  direction: string;
  return_pct: number;
  called_at: string;
  username: string;
  display_name: string | null;
};

export type TargetProgressRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  direction: string;
  target_progress: number;
  return_pct: number | null;
  username: string;
  called_at: string;
};

export type DeskVsCrowdRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  communityLongPct: number;
  communityCalls: number;
  deskDirection: "long" | "short" | null;
  diverges: boolean;
  bestReturnPct: number | null;
};

export type ConvictionRow = {
  symbol: string;
  asset_class: "equity" | "crypto";
  voteScore: number;
  callCount: number;
  latestDirection: string;
  bestReturnPct: number | null;
};

export type CommunityScreenerData = {
  mostCalled: MostCalledRow[];
  topReturns: TopReturnRow[];
  targetProgress: TargetProgressRow[];
  deskVsCrowd: DeskVsCrowdRow[];
  highConviction: ConvictionRow[];
};

export type ScreenerAssetFilter = "all" | "equity" | "crypto";

export function filterScreenerByAsset(
  data: CommunityScreenerData,
  filter: ScreenerAssetFilter
): CommunityScreenerData {
  if (filter === "all") return data;
  const match = (row: { asset_class: "equity" | "crypto" }) => row.asset_class === filter;
  return {
    mostCalled: data.mostCalled.filter(match),
    topReturns: data.topReturns.filter(match),
    targetProgress: data.targetProgress.filter(match),
    deskVsCrowd: data.deskVsCrowd.filter(match),
    highConviction: data.highConviction.filter(match),
  };
}

type RawCall = {
  symbol: string;
  asset_class?: string | null;
  direction: string;
  return_pct: number | null;
  called_at: string;
  is_fueled?: boolean;
  target_progress?: number | null;
  vote_score?: number | null;
  users?: { username: string; display_name: string | null; subscription_status?: string } | { username: string; display_name: string | null; subscription_status?: string }[];
};

function assetClassOf(c: RawCall): "equity" | "crypto" {
  return c.asset_class === "crypto" ? "crypto" : "equity";
}

function aggregateMostCalled(
  calls: {
    symbol: string;
    asset_class?: string | null;
    direction: string;
    return_pct: number | null;
    called_at: string;
  }[]
): MostCalledRow[] {
  const bySymbol = new Map<
    string,
    {
      count: number;
      latestDirection: string;
      bestReturn: number | null;
      latestAt: string;
      asset_class: "equity" | "crypto";
    }
  >();

  for (const c of calls) {
    const sym = c.symbol.toUpperCase();
    const prev = bySymbol.get(sym);
    const ret = c.return_pct != null ? Number(c.return_pct) : null;
    const ac = assetClassOf(c);
    if (!prev) {
      bySymbol.set(sym, {
        count: 1,
        latestDirection: c.direction,
        bestReturn: ret,
        latestAt: c.called_at,
        asset_class: ac,
      });
      continue;
    }
    prev.count += 1;
    if (c.called_at > prev.latestAt) {
      prev.latestAt = c.called_at;
      prev.latestDirection = c.direction;
      prev.asset_class = ac;
    }
    if (ret != null && (prev.bestReturn == null || ret > prev.bestReturn)) {
      prev.bestReturn = ret;
    }
  }

  return [...bySymbol.entries()]
    .map(([symbol, v]) => ({
      symbol,
      asset_class: v.asset_class,
      callCount: v.count,
      latestDirection: v.latestDirection,
      bestReturnPct: v.bestReturn,
    }))
    .sort((a, b) => b.callCount - a.callCount)
    .slice(0, 12);
}

function aggregateConviction(
  calls: RawCall[]
): ConvictionRow[] {
  const bySymbol = new Map<
    string,
    {
      votes: number;
      count: number;
      latestDirection: string;
      bestReturn: number | null;
      latestAt: string;
      asset_class: "equity" | "crypto";
    }
  >();

  for (const c of calls) {
    const sym = c.symbol.toUpperCase();
    const prev = bySymbol.get(sym);
    const votes = Number(c.vote_score ?? 0);
    const ret = c.return_pct != null ? Number(c.return_pct) : null;
    const ac = assetClassOf(c);
    if (!prev) {
      bySymbol.set(sym, {
        votes,
        count: 1,
        latestDirection: c.direction,
        bestReturn: ret,
        latestAt: c.called_at,
        asset_class: ac,
      });
      continue;
    }
    prev.votes += votes;
    prev.count += 1;
    if (c.called_at > prev.latestAt) {
      prev.latestDirection = c.direction;
      prev.asset_class = ac;
    }
    if (ret != null && (prev.bestReturn == null || ret > prev.bestReturn)) prev.bestReturn = ret;
  }

  return [...bySymbol.entries()]
    .map(([symbol, v]) => ({
      symbol,
      asset_class: v.asset_class,
      voteScore: v.votes,
      callCount: v.count,
      latestDirection: v.latestDirection,
      bestReturnPct: v.bestReturn,
    }))
    .sort((a, b) => b.voteScore - a.voteScore || b.callCount - a.callCount)
    .slice(0, 12);
}

function aggregateDeskVsCrowd(calls: RawCall[]): DeskVsCrowdRow[] {
  const bySymbol = new Map<
    string,
    {
      memberLong: number;
      memberShort: number;
      memberTotal: number;
      deskDirection: "long" | "short" | null;
      deskAt: string;
      bestReturn: number | null;
      asset_class: "equity" | "crypto";
    }
  >();

  for (const c of calls) {
    const sym = c.symbol.toUpperCase();
    const prev = bySymbol.get(sym) ?? {
      memberLong: 0,
      memberShort: 0,
      memberTotal: 0,
      deskDirection: null,
      deskAt: "",
      bestReturn: null,
      asset_class: assetClassOf(c),
    };
    const ret = c.return_pct != null ? Number(c.return_pct) : null;

    if (c.is_fueled) {
      if (c.called_at >= prev.deskAt) {
        prev.deskAt = c.called_at;
        prev.deskDirection = c.direction as "long" | "short";
      }
    } else {
      prev.memberTotal += 1;
      if (c.direction === "long") prev.memberLong += 1;
      else prev.memberShort += 1;
      prev.asset_class = assetClassOf(c);
    }

    if (ret != null && (prev.bestReturn == null || ret > prev.bestReturn)) {
      prev.bestReturn = ret;
    }

    bySymbol.set(sym, prev);
  }

  return [...bySymbol.entries()]
    .filter(([, v]) => v.memberTotal >= 2 && v.deskDirection != null)
    .map(([symbol, v]) => {
      const communityLongPct = Math.round((v.memberLong / v.memberTotal) * 100);
      const communityLean: "long" | "short" =
        communityLongPct >= 50 ? "long" : "short";
      return {
        symbol,
        asset_class: v.asset_class,
        communityLongPct,
        communityCalls: v.memberTotal,
        deskDirection: v.deskDirection,
        diverges: communityLean !== v.deskDirection,
        bestReturnPct: v.bestReturn,
      };
    })
    .sort((a, b) => Number(b.diverges) - Number(a.diverges) || b.communityCalls - a.communityCalls)
    .slice(0, 12);
}

function mapTargetProgress(rows: RawCall[]): TargetProgressRow[] {
  return rows
    .filter((c) => c.target_progress != null && !c.is_fueled)
    .map((c) => {
      const u = Array.isArray(c.users) ? c.users[0] : c.users;
      return {
        symbol: c.symbol.toUpperCase(),
        asset_class: assetClassOf(c),
        direction: c.direction,
        target_progress: Number(c.target_progress),
        return_pct: c.return_pct != null ? Number(c.return_pct) : null,
        username: u?.username ?? "member",
        called_at: c.called_at,
      };
    })
    .sort((a, b) => b.target_progress - a.target_progress)
    .slice(0, 12);
}

async function buildDemoData(): Promise<CommunityScreenerData> {
  const latest = await loadFeedCalls("latest");
  const weekCalls = latest
    .filter((c) => !c.is_fueled)
    .map((c) => ({
      symbol: c.symbol,
      asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
      direction: c.direction,
      return_pct: c.return_pct,
      called_at: c.called_at,
      vote_score: c.vote_score,
      target_progress: c.target_progress,
      is_fueled: false,
      users: c.users,
    }));

  const all30d = latest.map((c) => ({
    symbol: c.symbol,
    asset_class: c.asset_class,
    direction: c.direction,
    return_pct: c.return_pct,
    called_at: c.called_at,
    is_fueled: c.is_fueled,
    vote_score: c.vote_score,
    target_progress: c.target_progress,
  }));

  const fueled = latest.filter((c) => c.is_fueled);
  const combined30d = [
    ...weekCalls,
    ...fueled.map((c) => ({
      symbol: c.symbol,
      asset_class: c.asset_class,
      direction: c.direction,
      return_pct: c.return_pct,
      called_at: c.called_at,
      is_fueled: true,
    })),
  ];

  const performing = await loadFeedCalls("performing");

  return {
    mostCalled: aggregateMostCalled(weekCalls),
    topReturns: performing
      .filter((c) => !c.is_fueled && c.return_pct != null)
      .slice(0, 12)
      .map((c) => ({
        symbol: c.symbol,
        asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
        direction: c.direction,
        return_pct: Number(c.return_pct),
        called_at: c.called_at,
        username: c.users.username ?? c.users.pin,
        display_name: c.users.display_name,
      })),
    targetProgress: weekCalls
      .filter((c) => c.target_progress != null)
      .map((c) => ({
        symbol: c.symbol,
        asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
        direction: c.direction,
        target_progress: Number(c.target_progress),
        return_pct: c.return_pct != null ? Number(c.return_pct) : null,
        username: c.users.username ?? c.users.pin,
        called_at: c.called_at,
      }))
      .sort((a, b) => b.target_progress - a.target_progress)
      .slice(0, 12),
    deskVsCrowd: aggregateDeskVsCrowd(combined30d),
    highConviction: aggregateConviction(weekCalls),
  };
}

export async function fetchCommunityScreener(): Promise<CommunityScreenerData> {
  if (isDemoMode()) {
    return buildDemoData();
  }

  const db = createServiceClient();
  const sinceWeek = new Date(Date.now() - 7 * 86400000).toISOString();
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString();

  const [weekRes, topRes, progressRes, crowdRes] = await Promise.all([
    db
      .from("calls")
      .select("symbol, asset_class, direction, return_pct, called_at, vote_score")
      .eq("is_fueled", false)
      .gte("called_at", sinceWeek),
    db
      .from("calls")
      .select(
        "symbol, asset_class, direction, return_pct, called_at, users!inner(username, display_name, subscription_status)"
      )
      .eq("is_fueled", false)
      .eq("users.subscription_status", "active")
      .not("return_pct", "is", null)
      .gte("called_at", since30d)
      .order("return_pct", { ascending: false })
      .limit(15),
    db
      .from("calls")
      .select(
        "symbol, asset_class, direction, return_pct, called_at, target_progress, users!inner(username, display_name, subscription_status)"
      )
      .eq("is_fueled", false)
      .eq("users.subscription_status", "active")
      .not("target_progress", "is", null)
      .gte("called_at", since30d)
      .order("target_progress", { ascending: false })
      .limit(15),
    db
      .from("calls")
      .select("symbol, asset_class, direction, return_pct, called_at, is_fueled")
      .gte("called_at", since30d),
  ]);

  if (weekRes.error) console.error("[screener/week]", weekRes.error);
  if (topRes.error) console.error("[screener/top]", topRes.error);
  if (progressRes.error) console.error("[screener/progress]", progressRes.error);
  if (crowdRes.error) console.error("[screener/crowd]", crowdRes.error);

  const weekCalls = (weekRes.data ?? []) as RawCall[];
  const crowdCalls = (crowdRes.data ?? []) as RawCall[];

  const topReturns = (topRes.data ?? []).map((row) => {
    const c = row as RawCall;
    const u = Array.isArray(c.users) ? c.users[0] : c.users;
    return {
      symbol: c.symbol,
      asset_class: assetClassOf(c),
      direction: c.direction,
      return_pct: Number(c.return_pct),
      called_at: c.called_at,
      username: u?.username ?? "member",
      display_name: u?.display_name ?? null,
    };
  });

  return {
    mostCalled: aggregateMostCalled(weekCalls),
    topReturns,
    targetProgress: mapTargetProgress((progressRes.data ?? []) as RawCall[]),
    deskVsCrowd: aggregateDeskVsCrowd(crowdCalls),
    highConviction: aggregateConviction(weekCalls),
  };
}

export function screenerToCsv(data: CommunityScreenerData): string {
  const lines: string[] = [];

  lines.push("Most called this week (symbol,calls,direction,best_return_pct)");
  for (const r of data.mostCalled) {
    lines.push(
      `${r.symbol},${r.callCount},${r.latestDirection},${r.bestReturnPct ?? ""}`
    );
  }

  lines.push("");
  lines.push("Best 30-day returns (symbol,direction,return_pct,called_at,username)");
  for (const r of data.topReturns) {
    lines.push(
      `${r.symbol},${r.direction},${r.return_pct},${r.called_at},${r.username}`
    );
  }

  lines.push("");
  lines.push("Target progress leaders (symbol,direction,target_progress,return_pct,username)");
  for (const r of data.targetProgress) {
    lines.push(
      `${r.symbol},${r.direction},${r.target_progress},${r.return_pct ?? ""},${r.username}`
    );
  }

  lines.push("");
  lines.push("Desk vs crowd (symbol,community_long_pct,community_calls,desk_direction,diverges)");
  for (const r of data.deskVsCrowd) {
    lines.push(
      `${r.symbol},${r.communityLongPct},${r.communityCalls},${r.deskDirection ?? ""},${r.diverges}`
    );
  }

  lines.push("");
  lines.push("High conviction (symbol,vote_score,calls,direction,best_return_pct)");
  for (const r of data.highConviction) {
    lines.push(
      `${r.symbol},${r.voteScore},${r.callCount},${r.latestDirection},${r.bestReturnPct ?? ""}`
    );
  }

  return lines.join("\n");
}
