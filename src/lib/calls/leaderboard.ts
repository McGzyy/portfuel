import { createServiceClient } from "@/lib/db/supabase";

export type LeaderboardEntry = {
  id: string;
  display_name: string | null;
  calls_count: number;
  win_rate: number | null;
  rank_score: number;
  trusted: boolean;
};

export async function fetchLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("id, display_name, calls_count, win_rate, rank_score, trusted_at")
    .eq("subscription_status", "active")
    .gt("calls_count", 0)
    .order("rank_score", { ascending: false })
    .order("calls_count", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((u) => ({
    id: u.id,
    display_name: u.display_name,
    calls_count: u.calls_count ?? 0,
    win_rate: u.win_rate != null ? Number(u.win_rate) : null,
    rank_score: Number(u.rank_score ?? 0),
    trusted: Boolean(u.trusted_at),
  }));
}
