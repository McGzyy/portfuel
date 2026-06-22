import { cache } from "react";
import { fetchCallsFeed, refreshQuotesForSymbols } from "@/lib/calls/service";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoProfileStats } from "@/lib/demo/fixtures";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { fetchUserProfile, fetchUserRecentCalls } from "@/lib/users/profile";
import type { CallCardData } from "@/components/calls/CallCard";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
import { normalizeCallCardPrices } from "@/lib/calls/card-display";
import { callIsFromDiscovery, fetchDiscoveryOriginCallIds } from "@/lib/desk-discovery/call-origin";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export function mapCallForCard(
  c: Awaited<ReturnType<typeof fetchCallsFeed>>[number],
  hypeScores?: Record<string, number>,
  discoveryCallIds?: Set<string>
): CallCardData {
  const username = c.users.username ?? null;
  const prices = normalizeCallCardPrices(c);
  const row = c as typeof c & {
    closed_at?: string | null;
    peak_return_pct?: number | null;
    call_state?: string | null;
    trigger_entry_price?: number | null;
    expires_at?: string | null;
    price_at_call?: number | null;
  };

  return {
    id: c.id,
    user_id: c.user_id,
    symbol: c.symbol,
    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    ...prices,
    timeframe_tag: c.timeframe_tag,
    is_fueled: c.is_fueled,
    from_discovery: callIsFromDiscovery(c.id, discoveryCallIds),
    vote_score: c.vote_score,
    comment_count: c.comment_count,
    avatar_url: c.users.avatar_url ?? null,
    display_name: c.users.display_name,
    pin: username ?? c.users.pin,
    username,
    is_trusted: Boolean(c.users.trusted_at),
    hype_score: hypeScores?.[c.symbol.toUpperCase()] ?? null,
    updated_at: c.updated_at ?? null,
    closed_at: row.closed_at ?? null,
    peak_return_pct: row.peak_return_pct ?? null,
    call_state: row.call_state ?? null,
    trigger_entry_price: row.trigger_entry_price ?? null,
    expires_at: row.expires_at ?? null,
  };
}

/** Map feed rows to cards with Discovery origin badges resolved in one query. */
export async function mapFeedCallsForCard(
  calls: Awaited<ReturnType<typeof fetchCallsFeed>>,
  hypeScores?: Record<string, number>
): Promise<CallCardData[]> {
  const discoveryCallIds = await fetchDiscoveryOriginCallIds(calls.map((c) => c.id));
  return calls.map((c) => mapCallForCard(c, hypeScores, discoveryCallIds));
}

export const requireDashboardSession = cache(async function requireDashboardSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});

export async function loadMemberStats(userId: string) {
  if (isDemoMode()) return getDemoProfileStats();
  if (!hasSupabaseConfig()) return null;
  try {
    return await fetchUserProfile(userId);
  } catch {
    return null;
  }
}

export const loadFeedCalls = cache(async function loadFeedCalls(
  mode: "latest" | "performing" = "latest",
  options?: { refreshQuotes?: boolean }
) {
  if (!isDemoMode() && !hasSupabaseConfig()) return [];
  try {
    const calls = await fetchCallsFeed(mode);
    if (!options?.refreshQuotes) return calls;

    const symbols = [...new Set(calls.map((c) => c.symbol.toUpperCase()))];
    if (symbols.length === 0) return calls;

    try {
      await refreshQuotesForSymbols(symbols);
      return await fetchCallsFeed(mode);
    } catch (e) {
      console.error("[dashboard/refresh feed quotes]", e);
      return calls;
    }
  } catch (e) {
    console.error("[dashboard/data]", e);
    return [];
  }
});

export async function loadYourRecentCalls(
  userId: string,
  username: string,
  displayName: string | null,
  limit = 5
) {
  if (!isDemoMode() && !hasSupabaseConfig()) return [];
  try {
    const recent = await fetchUserRecentCalls(userId, limit);
    return recent.map((c) =>
      mapUserCallRowToCard(c, { userId, username, displayName })
    );
  } catch {
    return [];
  }
}
