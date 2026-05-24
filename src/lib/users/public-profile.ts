import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoMemberByUsername, getDemoMemberCalls } from "@/lib/demo/fixtures";

export type PublicMemberProfile = {
  id: string;
  username: string;
  display_name: string | null;
  trusted: boolean;
  calls_count: number;
  win_rate: number | null;
  avg_return_pct: number | null;
  rank_score: number;
  created_at: string;
};

export async function fetchMemberByUsername(
  username: string
): Promise<PublicMemberProfile | null> {
  const handle = username.trim().toLowerCase();
  if (!handle) return null;

  if (isDemoMode()) return getDemoMemberByUsername(handle);

  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select(
      "id, username, display_name, trusted_at, calls_count, win_rate, avg_return_pct, rank_score, created_at, subscription_status, role"
    )
    .ilike("username", handle)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as typeof data & { role?: string };
  if (row.subscription_status !== "active" && row.role !== "admin") return null;

  return {
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    trusted: Boolean(data.trusted_at),
    calls_count: data.calls_count ?? 0,
    win_rate: data.win_rate != null ? Number(data.win_rate) : null,
    avg_return_pct: data.avg_return_pct != null ? Number(data.avg_return_pct) : null,
    rank_score: Number(data.rank_score ?? 0),
    created_at: data.created_at,
  };
}

export async function fetchMemberPublicCalls(username: string, limit = 20) {
  const member = await fetchMemberByUsername(username);
  if (!member) return { member: null, calls: [] };

  if (isDemoMode()) {
    return { member, calls: getDemoMemberCalls(member.id, limit) };
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "id, symbol, asset_class, direction, thesis, called_at, return_pct, target_progress, entry_price, target_price, stop_price, last_price, timeframe_tag, vote_score, comment_count, is_fueled"
    )
    .eq("user_id", member.id)
    .order("called_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[public-profile/calls]", error);
    return { member, calls: [] };
  }
  return { member, calls: data ?? [] };
}
