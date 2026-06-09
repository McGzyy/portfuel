import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoProfileCalls } from "@/lib/demo/fixtures";
import {
  isMissingColumnDbError,
  USER_CALL_SELECT_EXTENDED,
  USER_CALL_SELECT_LEGACY,
} from "@/lib/calls/call-fields";

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

  let result = await db
    .from("calls")
    .select(USER_CALL_SELECT_EXTENDED)
    .eq("user_id", userId)
    .order("called_at", { ascending: false })
    .limit(limit);

  if (result.error && isMissingColumnDbError(result.error)) {
    result = await db
      .from("calls")
      .select(USER_CALL_SELECT_LEGACY)
      .eq("user_id", userId)
      .order("called_at", { ascending: false })
      .limit(limit);
  }

  if (result.error) {
    console.error("[profile/calls]", result.error);
    return [];
  }
  return result.data ?? [];
}
