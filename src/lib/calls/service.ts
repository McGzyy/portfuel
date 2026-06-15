import { createServiceClient, type CallWithUser, type TeaserCallRow } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  getDemoCallsBySymbol,
  getDemoCallsFeed,
  getDemoPublicTeasers,
} from "@/lib/demo/fixtures";
import {
  refreshAllQuotesAndScores,
  refreshQuotesForSymbols,
  type QuoteFetchResult,
} from "@/lib/calls/quote-refresh";

export { refreshQuotesForSymbols, type QuoteFetchResult };

export type TeaserView =
  | "teaser_latest_calls"
  | "teaser_performing_calls"
  | "teaser_all_time_calls"
  | "teaser_public_performing"
  | "teaser_public_proven";

export async function fetchTeaserCalls(view: TeaserView): Promise<TeaserCallRow[]> {
  if (isDemoMode()) {
    const { performing, proven } = getDemoPublicTeasers();
    if (view === "teaser_public_performing") return performing;
    if (view === "teaser_public_proven") return proven;
    const mode = view === "teaser_performing_calls" ? "performing" : "latest";
    return getDemoCallsFeed(mode).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      asset_class: c.asset_class,
      direction: c.direction,
      thesis: c.thesis,
      called_at: c.called_at,
      return_pct: c.return_pct,
      target_progress: c.target_progress,
      is_fueled: c.is_fueled,
      vote_score: c.vote_score,
      comment_count: c.comment_count,
      display_name: c.users.display_name,
      pin: c.users.username ?? c.users.pin,
      is_trusted: Boolean(c.users.trusted_at),
    }));
  }
  const db = createServiceClient();
  const { data, error } = await db.from(view).select("*");
  if (error) throw error;
  return (data ?? []) as TeaserCallRow[];
}

export async function fetchCallsFeed(
  mode: "latest" | "performing"
): Promise<CallWithUser[]> {
  if (isDemoMode()) return getDemoCallsFeed(mode);
  const db = createServiceClient();
  let query = db
    .from("calls")
    .select(
      "*, users!inner(id, pin, username, display_name, trusted_at, rank_score, subscription_status)"
    )
    .eq("users.subscription_status", "active");

  if (mode === "latest") {
    query = query.order("called_at", { ascending: false }).limit(50);
  } else {
    query = query
      .not("return_pct", "is", null)
      .gt("return_pct", 0)
      .gte("called_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .order("return_pct", { ascending: false })
      .order("called_at", { ascending: false })
      .limit(50);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CallWithUser[];
}

export async function fetchCallsBySymbol(symbol: string): Promise<CallWithUser[]> {
  if (isDemoMode()) return getDemoCallsBySymbol(symbol);
  const db = createServiceClient();
  const { data, error } = await db
    .from("calls")
    .select("*, users!inner(id, pin, username, display_name, trusted_at, rank_score, avatar_url)")
    .eq("symbol", symbol.toUpperCase())
    .order("is_fueled", { ascending: false })
    .order("called_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CallWithUser[];
}

export async function refreshQuotesAndScores(): Promise<{
  updated: number;
  milestonesNotified: number;
  memberWinGates: number;
  quotes: QuoteFetchResult[];
}> {
  const result = await refreshAllQuotesAndScores();
  return {
    updated: result.updated,
    milestonesNotified: result.milestonesNotified,
    memberWinGates: result.memberWinGates,
    quotes: result.quotes,
  };
}
