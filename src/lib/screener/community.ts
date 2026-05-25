import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { loadFeedCalls } from "@/lib/dashboard/data";

export type MostCalledRow = {
  symbol: string;
  callCount: number;
  latestDirection: string;
  bestReturnPct: number | null;
};

export type TopReturnRow = {
  symbol: string;
  direction: string;
  return_pct: number;
  called_at: string;
  username: string;
  display_name: string | null;
};

export type CommunityScreenerData = {
  mostCalled: MostCalledRow[];
  topReturns: TopReturnRow[];
};

function aggregateMostCalled(
  calls: { symbol: string; direction: string; return_pct: number | null; called_at: string }[]
): MostCalledRow[] {
  const bySymbol = new Map<
    string,
    { count: number; latestDirection: string; bestReturn: number | null; latestAt: string }
  >();

  for (const c of calls) {
    const sym = c.symbol.toUpperCase();
    const prev = bySymbol.get(sym);
    const ret = c.return_pct != null ? Number(c.return_pct) : null;
    if (!prev) {
      bySymbol.set(sym, {
        count: 1,
        latestDirection: c.direction,
        bestReturn: ret,
        latestAt: c.called_at,
      });
      continue;
    }
    prev.count += 1;
    if (c.called_at > prev.latestAt) {
      prev.latestAt = c.called_at;
      prev.latestDirection = c.direction;
    }
    if (ret != null && (prev.bestReturn == null || ret > prev.bestReturn)) {
      prev.bestReturn = ret;
    }
  }

  return [...bySymbol.entries()]
    .map(([symbol, v]) => ({
      symbol,
      callCount: v.count,
      latestDirection: v.latestDirection,
      bestReturnPct: v.bestReturn,
    }))
    .sort((a, b) => b.callCount - a.callCount)
    .slice(0, 12);
}

export async function fetchCommunityScreener(): Promise<CommunityScreenerData> {
  if (isDemoMode()) {
    const latest = await loadFeedCalls("latest");
    const weekCalls = latest
      .filter((c) => !c.is_fueled)
      .map((c) => ({
        symbol: c.symbol,
        direction: c.direction,
        return_pct: c.return_pct,
        called_at: c.called_at,
      }));
    const performing = await loadFeedCalls("performing");
    return {
      mostCalled: aggregateMostCalled(weekCalls),
      topReturns: performing
        .filter((c) => !c.is_fueled && c.return_pct != null)
        .slice(0, 12)
        .map((c) => ({
          symbol: c.symbol,
          direction: c.direction,
          return_pct: Number(c.return_pct),
          called_at: c.called_at,
          username: c.users.username ?? c.users.pin,
          display_name: c.users.display_name,
        })),
    };
  }

  const db = createServiceClient();
  const sinceWeek = new Date(Date.now() - 7 * 86400000).toISOString();
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: weekCalls, error: weekErr } = await db
    .from("calls")
    .select("symbol, direction, return_pct, called_at")
    .eq("is_fueled", false)
    .gte("called_at", sinceWeek);

  if (weekErr) {
    console.error("[screener/week]", weekErr);
    return { mostCalled: [], topReturns: [] };
  }

  const { data: topCalls, error: topErr } = await db
    .from("calls")
    .select(
      "symbol, direction, return_pct, called_at, users!inner(username, display_name, subscription_status)"
    )
    .eq("is_fueled", false)
    .eq("users.subscription_status", "active")
    .not("return_pct", "is", null)
    .gte("called_at", since30d)
    .order("return_pct", { ascending: false })
    .limit(15);

  if (topErr) {
    console.error("[screener/top]", topErr);
    return {
      mostCalled: aggregateMostCalled(
        (weekCalls ?? []) as {
          symbol: string;
          direction: string;
          return_pct: number | null;
          called_at: string;
        }[]
      ),
      topReturns: [],
    };
  }

  const topReturns = (topCalls ?? []).map((row) => {
    const c = row as {
      symbol: string;
      direction: string;
      return_pct: number;
      called_at: string;
      users: { username: string; display_name: string | null } | { username: string; display_name: string | null }[];
    };
    const u = Array.isArray(c.users) ? c.users[0] : c.users;
    return {
      symbol: c.symbol,
      direction: c.direction,
      return_pct: Number(c.return_pct),
      called_at: c.called_at,
      username: u?.username ?? "member",
      display_name: u?.display_name ?? null,
    };
  });

  return {
    mostCalled: aggregateMostCalled(
      (weekCalls ?? []) as {
        symbol: string;
        direction: string;
        return_pct: number | null;
        called_at: string;
      }[]
    ),
    topReturns,
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

  return lines.join("\n");
}
