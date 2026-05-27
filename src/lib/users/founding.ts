import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

const FOUNDING_MEMBER_LIMIT = 25;

/** Earliest activated members for social proof badges. */
export async function fetchFoundingMemberIds(
  limit = FOUNDING_MEMBER_LIMIT
): Promise<Set<string>> {
  if (isDemoMode()) return new Set();

  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("id")
    .eq("subscription_status", "active")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) return new Set();
  return new Set(data.map((r) => r.id));
}
