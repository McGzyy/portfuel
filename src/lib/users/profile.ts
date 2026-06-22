import { cache } from "react";
import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoProfileCalls } from "@/lib/demo/fixtures";
import {
  isMissingColumnDbError,
  USER_CALL_SELECT_EXTENDED,
  USER_CALL_SELECT_FULL,
  USER_CALL_SELECT_LEGACY,
  type UserCallRow,
} from "@/lib/calls/call-fields";

export const fetchUserProfile = cache(async function fetchUserProfile(
  userId: string
): Promise<UserRow | null> {
  const db = createServiceClient();
  const { data, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.error("[profile]", error);
    return null;
  }
  return data as UserRow | null;
});

export async function fetchUserRecentCalls(userId: string, limit = 10): Promise<UserCallRow[]> {
  if (isDemoMode()) return getDemoProfileCalls(userId).slice(0, limit) as UserCallRow[];
  const db = createServiceClient();

  for (const select of [USER_CALL_SELECT_FULL, USER_CALL_SELECT_EXTENDED, USER_CALL_SELECT_LEGACY]) {
    const { data, error } = await db
      .from("calls")
      .select(select)
      .eq("user_id", userId)
      .order("called_at", { ascending: false })
      .limit(limit);

    if (!error) return (data ?? []) as unknown as UserCallRow[];
    if (!isMissingColumnDbError(error)) {
      console.error("[profile/calls]", error);
      return [];
    }
  }

  return [];
}

const EXPORT_CALL_LIMIT = 5000;

/** All published calls for CSV export (newest first). */
export async function fetchUserCallsForExport(userId: string): Promise<UserCallRow[]> {
  if (isDemoMode()) return getDemoProfileCalls(userId) as UserCallRow[];
  const db = createServiceClient();

  for (const select of [USER_CALL_SELECT_FULL, USER_CALL_SELECT_EXTENDED, USER_CALL_SELECT_LEGACY]) {
    const { data, error } = await db
      .from("calls")
      .select(select)
      .eq("user_id", userId)
      .order("called_at", { ascending: false })
      .limit(EXPORT_CALL_LIMIT);

    if (!error) return (data ?? []) as unknown as UserCallRow[];
    if (!isMissingColumnDbError(error)) {
      console.error("[profile/calls-export]", error);
      return [];
    }
  }

  return [];
}
