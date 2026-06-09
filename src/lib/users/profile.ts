import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoProfileCalls } from "@/lib/demo/fixtures";

export async function fetchUserProfile(userId: string): Promise<UserRow | null> {
  const db = createServiceClient();
  const { data, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.error("[profile]", error);
    return null;
  }
  return data as UserRow | null;
}

export async function fetchUserRecentCalls(userId: string, limit = 10) {
  if (isDemoMode()) return getDemoProfileCalls(userId).slice(0, limit);
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select(
      "id, symbol, asset_class, direction, thesis, called_at, return_pct, peak_return_pct, closed_at, exit_price, target_progress, entry_price, price_at_call, target_price, stop_price, last_price, timeframe_tag, vote_score, comment_count, is_fueled"
    )
    .eq("user_id", userId)
    .order("called_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[profile/calls]", error);
    return [];
  }
  return data ?? [];
}
