import { createServiceClient } from "@/lib/db/supabase";
import { isCallWin } from "@/lib/scoring/call-credit";
import { isMissingColumnDbError } from "@/lib/calls/call-fields";

type RankingCallRow = {
  return_pct: number | null;
  peak_return_pct?: number | null;
  closed_at?: string | null;
  target_progress: number | null;
  score_points: number | null;
};

async function fetchCallsForRanking(
  db: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<RankingCallRow[]> {
  const extended = await db
    .from("calls")
    .select("return_pct, peak_return_pct, closed_at, target_progress, score_points")
    .eq("user_id", userId);

  if (!extended.error) return (extended.data ?? []) as RankingCallRow[];

  if (isMissingColumnDbError(extended.error)) {
    const legacy = await db
      .from("calls")
      .select("return_pct, target_progress, score_points")
      .eq("user_id", userId);
    if (legacy.error) throw legacy.error;
    return (legacy.data ?? []) as RankingCallRow[];
  }

  throw extended.error;
}

/** Recompute rank_score and win_rate for all active members from their calls. */
export async function refreshMemberRankings(): Promise<{ usersUpdated: number }> {
  const db = createServiceClient();
  const { data: users, error: usersErr } = await db
    .from("users")
    .select("id")
    .eq("subscription_status", "active");
  if (usersErr) throw usersErr;

  let usersUpdated = 0;
  for (const user of users ?? []) {
    const rows = await fetchCallsForRanking(db, user.id);
    const withReturn = rows.filter((c) => c.return_pct != null);
    const wins = withReturn.filter((c) =>
      isCallWin({
        return_pct: c.return_pct != null ? Number(c.return_pct) : null,
        peak_return_pct: c.peak_return_pct != null ? Number(c.peak_return_pct) : null,
        closed_at: c.closed_at ?? null,
        target_progress:
          c.target_progress != null ? Number(c.target_progress) : null,
      })
    ).length;
    const winRate =
      withReturn.length > 0 ? Math.round((wins / withReturn.length) * 10000) / 100 : null;
    const rankScore = rows.reduce((sum, c) => sum + Number(c.score_points ?? 0), 0);

    await db
      .from("users")
      .update({
        rank_score: Math.round(rankScore * 100) / 100,
        win_rate: winRate,
        calls_count: rows.length,
      } as never)
      .eq("id", user.id);
    usersUpdated++;
  }

  return { usersUpdated };
}
