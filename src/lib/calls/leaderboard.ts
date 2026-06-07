import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoLeaderboard } from "@/lib/demo/fixtures";
import { fetchFoundingMemberIds } from "@/lib/users/founding";

export type LeaderboardEntry = {
  id: string;
  display_name: string | null;
  username: string | null;
  calls_count: number;
  win_rate: number | null;
  rank_score: number;
  trusted: boolean;
  founding: boolean;
};

export async function fetchLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  if (isDemoMode()) {
    return getDemoLeaderboard(limit).map((row) => ({ ...row, founding: false }));
  }
  const db = createServiceClient();
  const foundingIds = await fetchFoundingMemberIds();
  const { data, error } = await db
    .from("users")
    .select("id, username, display_name, calls_count, win_rate, rank_score, trusted_at")
    .eq("subscription_status", "active")
    .gt("calls_count", 0)
    .order("rank_score", { ascending: false })
    .order("calls_count", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((u) => {
    const row = u as typeof u & { username?: string | null };
    return {
    id: row.id,
    display_name: row.display_name,
    username: row.username ?? null,
    calls_count: u.calls_count ?? 0,
    win_rate: u.win_rate != null ? Number(u.win_rate) : null,
    rank_score: Number(u.rank_score ?? 0),
    trusted: Boolean(row.trusted_at),
    founding: foundingIds.has(row.id),
  };
  });
}
