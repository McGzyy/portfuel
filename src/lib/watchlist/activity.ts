import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import type { WatchlistEntry } from "@/lib/watchlist/types";

const ACTIVITY_DAYS = 7;

export async function fetchRecentCallCountsBySymbols(
  symbols: string[]
): Promise<Record<string, number>> {
  if (symbols.length === 0 || isDemoMode()) return {};

  const db = createServiceClient();
  const since = new Date(Date.now() - ACTIVITY_DAYS * 86400000).toISOString();
  const upper = symbols.map((s) => s.toUpperCase());

  const { data, error } = await db
    .from("calls")
    .select("symbol")
    .in("symbol", upper)
    .gte("called_at", since);

  if (error) {
    console.error("[watchlist/activity/counts]", error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const sym = (row as { symbol: string }).symbol.toUpperCase();
    counts[sym] = (counts[sym] ?? 0) + 1;
  }
  return counts;
}

export async function fetchUnreadWatchlistCallSymbols(
  userId: string
): Promise<Set<string>> {
  if (isDemoMode()) return new Set(["NVDA"]);

  const db = createServiceClient();
  const { data, error } = await db
    .from("user_notifications")
    .select("href")
    .eq("user_id", userId)
    .eq("type", "watchlist_call")
    .is("read_at", null);

  if (error) {
    console.error("[watchlist/activity/unread]", error);
    return new Set();
  }

  const symbols = new Set<string>();
  for (const row of data ?? []) {
    const href = (row as { href: string }).href;
    const match = /^\/ticker\/([^/?#]+)/i.exec(href);
    if (match) symbols.add(match[1].toUpperCase());
  }
  return symbols;
}

export async function enrichWatchlistActivity(
  userId: string,
  entries: WatchlistEntry[]
): Promise<WatchlistEntry[]> {
  if (entries.length === 0) return entries;

  const symbols = entries.map((e) => e.symbol);
  const [counts, unread] = await Promise.all([
    fetchRecentCallCountsBySymbols(symbols),
    fetchUnreadWatchlistCallSymbols(userId),
  ]);

  return entries.map((e) => {
    const sym = e.symbol.toUpperCase();
    return {
      ...e,
      community_calls_7d: counts[sym] ?? 0,
      has_unread_call_alert: unread.has(sym),
    };
  });
}
