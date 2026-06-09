import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoProfileCalls } from "@/lib/demo/fixtures";
import {
  isMissingColumnDbError,
  USER_CALL_SELECT_EXTENDED,
  USER_CALL_SELECT_LEGACY,
  type UserCallRow,
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

export async function fetchUserRecentCalls(userId: string, limit = 10): Promise<UserCallRow[]> {
  if (isDemoMode()) return getDemoProfileCalls(userId).slice(0, limit) as UserCallRow[];
  const db = createServiceClient();

  const extended = await db
    .from("calls")
    .select(USER_CALL_SELECT_EXTENDED)
    .eq("user_id", userId)
    .order("called_at", { ascending: false })
    .limit(limit);

  if (!extended.error) return (extended.data ?? []) as UserCallRow[];

  if (isMissingColumnDbError(extended.error)) {
    const legacy = await db
      .from("calls")
      .select(USER_CALL_SELECT_LEGACY)
      .eq("user_id", userId)
      .order("called_at", { ascending: false })
      .limit(limit);

    if (!legacy.error) return (legacy.data ?? []) as UserCallRow[];
    console.error("[profile/calls]", legacy.error);
    return [];
  }

  console.error("[profile/calls]", extended.error);
  return [];
}

const EXPORT_CALL_LIMIT = 5000;

/** All published calls for CSV export (newest first). */
export async function fetchUserCallsForExport(userId: string): Promise<UserCallRow[]> {
  if (isDemoMode()) return getDemoProfileCalls(userId) as UserCallRow[];
  const db = createServiceClient();

  const extended = await db
    .from("calls")
    .select(USER_CALL_SELECT_EXTENDED)
    .eq("user_id", userId)
    .order("called_at", { ascending: false })
    .limit(EXPORT_CALL_LIMIT);

  if (!extended.error) return (extended.data ?? []) as UserCallRow[];

  if (isMissingColumnDbError(extended.error)) {
    const legacy = await db
      .from("calls")
      .select(USER_CALL_SELECT_LEGACY)
      .eq("user_id", userId)
      .order("called_at", { ascending: false })
      .limit(EXPORT_CALL_LIMIT);

    if (!legacy.error) return (legacy.data ?? []) as UserCallRow[];
    console.error("[profile/calls-export]", legacy.error);
    return [];
  }

  console.error("[profile/calls-export]", extended.error);
  return [];
}
