import { createServiceClient } from "@/lib/db/supabase";
import type { UserLifecycleRow } from "@/lib/member-lifecycle/types";

export async function fetchUserLifecycle(userId: string): Promise<UserLifecycleRow | null> {
  const db = createServiceClient();
  const { data, error } = await db.from("users").select("*").eq("id", userId).maybeSingle();

  if (error || !data) return null;
  return data as UserLifecycleRow;
}

export async function fetchUserActivitySummary(userId: string) {
  const db = createServiceClient();

  const [calls, referrals] = await Promise.all([
    db.from("calls").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db
      .from("user_referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId),
  ]);

  return {
    callsCount: calls.count ?? 0,
    referralsCount: referrals.count ?? 0,
  };
}
