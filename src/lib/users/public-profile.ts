import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoMemberByUsername, getDemoMemberCalls } from "@/lib/demo/fixtures";
import { fetchFoundingMemberIds } from "@/lib/users/founding";
import { fetchUserRecentCalls } from "@/lib/users/profile";

export type PublicMemberProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  trusted: boolean;
  founding: boolean;
  calls_count: number;
  win_rate: number | null;
  avg_return_pct: number | null;
  rank_score: number;
  created_at: string;
  last_active_at: string | null;
};

export async function fetchMemberByUsername(
  username: string
): Promise<PublicMemberProfile | null> {
  const handle = username.trim().toLowerCase();
  if (!handle) return null;

  if (isDemoMode()) {
    const demo = getDemoMemberByUsername(handle);
    if (!demo) return null;
    return {
      ...demo,
      bio: null,
      avatar_url: null,
      founding: false,
      last_active_at: new Date().toISOString(),
    };
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select(
      "id, username, display_name, bio, avatar_url, trusted_at, calls_count, win_rate, avg_return_pct, rank_score, created_at, last_active_at, subscription_status, role"
    )
    .ilike("username", handle)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as typeof data & { role?: string };
  if (row.subscription_status !== "active" && row.role !== "admin") return null;
  const foundingIds = await fetchFoundingMemberIds();

  return {
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    bio: (data as { bio?: string | null }).bio ?? null,
    avatar_url: (data as { avatar_url?: string | null }).avatar_url ?? null,
    trusted: Boolean(data.trusted_at),
    founding: foundingIds.has(data.id),
    calls_count: data.calls_count ?? 0,
    win_rate: data.win_rate != null ? Number(data.win_rate) : null,
    avg_return_pct: data.avg_return_pct != null ? Number(data.avg_return_pct) : null,
    rank_score: Number(data.rank_score ?? 0),
    created_at: data.created_at,
    last_active_at: (data as { last_active_at?: string | null }).last_active_at ?? null,
  };
}

export async function fetchMemberPublicCalls(username: string, limit = 20) {
  const member = await fetchMemberByUsername(username);
  if (!member) return { member: null, calls: [] };

  if (isDemoMode()) {
    return { member, calls: getDemoMemberCalls(member.id, limit) };
  }

  const calls = await fetchUserRecentCalls(member.id, limit);
  return { member, calls };
}
