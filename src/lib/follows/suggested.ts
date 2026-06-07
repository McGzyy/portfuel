import { createServiceClient } from "@/lib/db/supabase";
import type { CallWithUser } from "@/lib/db/supabase";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoCallsBySymbol } from "@/lib/demo/fixtures";
import { fetchFollowingIds } from "@/lib/follows/service";
import type { SuggestedFollow } from "@/lib/follows/types";

const MAX_SUGGESTIONS = 5;

type AggRow = {
  userId: string;
  username: string;
  displayName: string | null;
  rankScore: number;
  trusted: boolean;
  symbols: Set<string>;
  overlapCalls: number;
  returnSum: number;
  returnCount: number;
};

function formatReason(symbols: string[]): string {
  if (symbols.length === 0) return "Top ranked caller";
  const list = symbols.slice(0, 3).join(", ");
  const extra = symbols.length > 3 ? ` +${symbols.length - 3}` : "";
  return `Active on ${list}${extra}`;
}

function toSuggestion(row: AggRow): SuggestedFollow {
  const overlapSymbols = [...row.symbols].sort();
  return {
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    rankScore: row.rankScore,
    trusted: row.trusted,
    overlapSymbols,
    overlapCalls: row.overlapCalls,
    avgReturnPct:
      row.returnCount > 0 ? Math.round((row.returnSum / row.returnCount) * 10) / 10 : null,
    reason: formatReason(overlapSymbols),
  };
}

function aggregateFromCalls(
  symbols: string[],
  viewerId: string,
  followingIds: Set<string>,
  loadCalls: (symbol: string) => CallWithUser[]
): SuggestedFollow[] {
  const byUser = new Map<string, AggRow>();

  for (const symbol of symbols) {
    const sym = symbol.toUpperCase();
    for (const call of loadCalls(sym)) {
      if (call.is_fueled || call.source === "fueled") continue;
      if (call.user_id === viewerId || followingIds.has(call.user_id)) continue;

      const user = call.users;
      if (!user?.username) continue;

      let row = byUser.get(call.user_id);
      if (!row) {
        row = {
          userId: call.user_id,
          username: user.username,
          displayName: user.display_name,
          rankScore: Number(user.rank_score ?? 0),
          trusted: Boolean(user.trusted_at),
          symbols: new Set(),
          overlapCalls: 0,
          returnSum: 0,
          returnCount: 0,
        };
        byUser.set(call.user_id, row);
      }

      row.symbols.add(sym);
      row.overlapCalls += 1;
      if (call.return_pct != null) {
        row.returnSum += Number(call.return_pct);
        row.returnCount += 1;
      }
    }
  }

  return [...byUser.values()]
    .sort((a, b) => {
      if (b.overlapCalls !== a.overlapCalls) return b.overlapCalls - a.overlapCalls;
      const aRet = a.returnCount ? a.returnSum / a.returnCount : -Infinity;
      const bRet = b.returnCount ? b.returnSum / b.returnCount : -Infinity;
      if (bRet !== aRet) return bRet - aRet;
      return b.rankScore - a.rankScore;
    })
    .slice(0, MAX_SUGGESTIONS)
    .map(toSuggestion);
}

async function fetchFallbackSuggestions(
  viewerId: string,
  followingIds: Set<string>
): Promise<SuggestedFollow[]> {
  const rows = await fetchLeaderboard(15);
  return rows
    .filter((r) => r.id !== viewerId && !followingIds.has(r.id) && r.username)
    .sort((a, b) => {
      if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
      return b.rank_score - a.rank_score;
    })
    .slice(0, MAX_SUGGESTIONS)
    .map((r) => ({
      userId: r.id,
      username: r.username!,
      displayName: r.display_name,
      rankScore: r.rank_score,
      trusted: r.trusted,
      overlapSymbols: [],
      overlapCalls: 0,
      avgReturnPct: null,
      reason: r.trusted ? "Trusted on the leaderboard" : "Top ranked caller",
    }));
}

async function fetchSuggestedFromDb(
  viewerId: string,
  symbols: string[],
  followingIds: Set<string>
): Promise<SuggestedFollow[]> {
  if (symbols.length === 0) {
    return fetchFallbackSuggestions(viewerId, followingIds);
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "symbol, return_pct, user_id, is_fueled, source, users!inner(id, username, display_name, rank_score, trusted_at, subscription_status)"
    )
    .in("symbol", symbols.map((s) => s.toUpperCase()))
    .eq("users.subscription_status", "active")
    .eq("is_fueled", false)
    .neq("user_id", viewerId);

  if (error) {
    console.error("[follows/suggested]", error);
    return fetchFallbackSuggestions(viewerId, followingIds);
  }

  const byUser = new Map<string, AggRow>();

  for (const raw of data ?? []) {
    const row = raw as unknown as {
      symbol: string;
      return_pct: number | null;
      user_id: string;
      users:
        | {
            id: string;
            username: string;
            display_name: string | null;
            rank_score: number;
            trusted_at: string | null;
          }
        | {
            id: string;
            username: string;
            display_name: string | null;
            rank_score: number;
            trusted_at: string | null;
          }[];
    };
    const call = row;
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    if (!user?.username) continue;

    if (followingIds.has(call.user_id)) continue;

    let agg = byUser.get(call.user_id);
    if (!agg) {
      agg = {
        userId: call.user_id,
        username: user.username,
        displayName: user.display_name,
        rankScore: Number(user.rank_score ?? 0),
        trusted: Boolean(user.trusted_at),
        symbols: new Set(),
        overlapCalls: 0,
        returnSum: 0,
        returnCount: 0,
      };
      byUser.set(call.user_id, agg);
    }

    agg.symbols.add(call.symbol.toUpperCase());
    agg.overlapCalls += 1;
    if (call.return_pct != null) {
      agg.returnSum += Number(call.return_pct);
      agg.returnCount += 1;
    }
  }

  const ranked = [...byUser.values()]
    .sort((a, b) => {
      if (b.overlapCalls !== a.overlapCalls) return b.overlapCalls - a.overlapCalls;
      const aRet = a.returnCount ? a.returnSum / a.returnCount : -Infinity;
      const bRet = b.returnCount ? b.returnSum / b.returnCount : -Infinity;
      if (bRet !== aRet) return bRet - aRet;
      return b.rankScore - a.rankScore;
    })
    .slice(0, MAX_SUGGESTIONS)
    .map(toSuggestion);

  if (ranked.length > 0) return ranked;
  return fetchFallbackSuggestions(viewerId, followingIds);
}

export async function fetchSuggestedFollows(
  viewerId: string,
  watchlistSymbols: string[]
): Promise<SuggestedFollow[]> {
  const followingIds = new Set(await fetchFollowingIds(viewerId));
  const symbols = [...new Set(watchlistSymbols.map((s) => s.toUpperCase()))];

  if (isDemoMode()) {
    const fromWatchlist = aggregateFromCalls(symbols, viewerId, followingIds, getDemoCallsBySymbol);
    if (fromWatchlist.length > 0) return fromWatchlist;
    return fetchFallbackSuggestions(viewerId, followingIds);
  }

  return fetchSuggestedFromDb(viewerId, symbols, followingIds);
}
