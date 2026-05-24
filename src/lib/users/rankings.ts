import { createServiceClient } from "@/lib/db/supabase";

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
    const { data: calls, error } = await db
      .from("calls")
      .select("return_pct, score_points")
      .eq("user_id", user.id);
    if (error) throw error;

    const rows = calls ?? [];
    const withReturn = rows.filter((c) => c.return_pct != null);
    const wins = withReturn.filter((c) => Number(c.return_pct) > 0).length;
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
