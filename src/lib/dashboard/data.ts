import { fetchCallsFeed } from "@/lib/calls/service";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoProfileStats } from "@/lib/demo/fixtures";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import { fetchUserProfile, fetchUserRecentCalls } from "@/lib/users/profile";
import type { CallCardData } from "@/components/calls/CallCard";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export function mapCallForCard(
  c: Awaited<ReturnType<typeof fetchCallsFeed>>[number],
  hypeScores?: Record<string, number>
): CallCardData {
  const username = c.users.username ?? null;
  return {
    id: c.id,
    symbol: c.symbol,
    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    target_progress: c.target_progress,
    entry_price: c.entry_price,
    target_price: c.target_price,
    stop_price: c.stop_price,
    last_price: c.last_price,
    timeframe_tag: c.timeframe_tag,
    is_fueled: c.is_fueled,
    vote_score: c.vote_score,
    comment_count: c.comment_count,
    display_name: c.users.display_name,
    pin: username ?? c.users.pin,
    username,
    is_trusted: Boolean(c.users.trusted_at),
    hype_score: hypeScores?.[c.symbol.toUpperCase()] ?? null,
  };
}

export async function requireDashboardSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function loadMemberStats(userId: string) {
  if (isDemoMode()) return getDemoProfileStats();
  if (!hasSupabaseConfig()) return null;
  try {
    return await fetchUserProfile(userId);
  } catch {
    return null;
  }
}

export async function loadFeedCalls(mode: "latest" | "performing" = "latest") {
  if (!isDemoMode() && !hasSupabaseConfig()) return [];
  try {
    return await fetchCallsFeed(mode);
  } catch (e) {
    console.error("[dashboard/data]", e);
    return [];
  }
}

export async function loadYourRecentCalls(
  userId: string,
  username: string,
  displayName: string | null,
  limit = 5
) {
  if (!isDemoMode() && !hasSupabaseConfig()) return [];
  try {
    const recent = await fetchUserRecentCalls(userId, limit);
    return recent.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
      direction: c.direction,
      thesis: c.thesis,
      called_at: c.called_at,
      return_pct: c.return_pct,
      is_fueled: c.is_fueled,
      pin: username,
      username,
      display_name: displayName,
    })) satisfies CallCardData[];
  } catch {
    return [];
  }
}
