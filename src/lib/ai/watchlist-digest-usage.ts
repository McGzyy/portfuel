import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { watchlistDigestLimitForRole } from "@/lib/ai/config";
import { currentUsagePeriod } from "@/lib/ai/usage";
import type { MembershipTier } from "@/lib/stripe/config";

export type WatchlistDigestUsageStatus = {
  used: number;
  limit: number;
  remaining: number;
  periodMonth: string;
  configured: boolean;
};

export async function fetchWatchlistDigestUsage(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  configured: boolean;
}): Promise<WatchlistDigestUsageStatus> {
  const limit = watchlistDigestLimitForRole(opts.membershipTier, opts.role);
  const periodMonth = currentUsagePeriod();

  if (isDemoMode()) {
    return { used: 0, limit, remaining: limit, periodMonth, configured: opts.configured };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("user_ai_usage")
    .select("watchlist_digest_used")
    .eq("user_id", opts.userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const used =
    (data as { watchlist_digest_used: number } | null)?.watchlist_digest_used ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    periodMonth,
    configured: opts.configured,
  };
}

export async function consumeWatchlistDigest(userId: string): Promise<number> {
  if (isDemoMode()) return 1;

  const db = createServiceClient();
  const periodMonth = currentUsagePeriod();
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from("user_ai_usage")
    .select(
      "watchlist_digest_used, journal_alerts_used, journal_research_used, reviews_used, summaries_used"
    )
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .maybeSingle();

  const row = existing as {
    watchlist_digest_used: number;
    journal_alerts_used: number;
    journal_research_used: number;
    reviews_used: number;
    summaries_used: number;
  } | null;
  const next = (row?.watchlist_digest_used ?? 0) + 1;

  const { error } = await db.from("user_ai_usage").upsert(
    {
      user_id: userId,
      period_month: periodMonth,
      watchlist_digest_used: next,
      journal_alerts_used: row?.journal_alerts_used ?? 0,
      journal_research_used: row?.journal_research_used ?? 0,
      reviews_used: row?.reviews_used ?? 0,
      summaries_used: row?.summaries_used ?? 0,
      updated_at: now,
    } as never,
    { onConflict: "user_id,period_month" }
  );

  if (error) {
    console.error("[ai/watchlist-digest-usage/consume]", error);
    throw new Error("usage_persist_failed");
  }

  return next;
}
