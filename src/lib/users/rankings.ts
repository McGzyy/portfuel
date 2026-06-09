import { createServiceClient } from "@/lib/db/supabase";
import { isCallWin } from "@/lib/scoring/call-credit";
import {
  isMissingColumnDbError,
} from "@/lib/calls/call-fields";

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
    let result = await db
      .from("calls")
      .select("return_pct, peak_return_pct, closed_at, target_progress, score_points")
      .eq("user_id", user.id);

    if (result.error && isMissingColumnDbError(result.error)) {
      result = await db
        .from("calls")
        .select("return_pct, target_progress, score_points")
        .eq("user_id", user.id);
    }

    if (result.error) throw result.error;

    const rows = result.data ?? [];
    const withReturn = rows.filter((c) => c.return_pct != null);
    const wins = withReturn.filter((c) =>
      isCallWin({
        return_pct: c.return_pct != null ? Number(c.return_pct) : null,
        peak_return_pct: c.peak_return_pct != null ? Number(c.peak_return_pct) : null,
        closed_at: (c as { closed_at?: string | null }).closed_at ?? null,
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
