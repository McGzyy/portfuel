import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

export type JournalHighlightRow = {
  symbol: string;
  conviction: number;
  outcome: string;
  thesis: string | null;
  last_price: number | null;
  base_case_price: number | null;
};

const ACTIVE_OUTCOMES = new Set(["watching", "developing"]);

/** High-conviction active journal ideas for overview / watchlist pulse. */
export async function fetchJournalHighlights(
  userId: string,
  minConviction = 8
): Promise<JournalHighlightRow[]> {
  if (isDemoMode()) return [];

  const db = createServiceClient();
  const { data, error } = await db
    .from("user_watchlist")
    .select(
      "symbol, conviction, outcome, thesis, base_case_price"
    )
    .eq("user_id", userId)
    .gte("conviction", minConviction)
    .in("outcome", ["watching", "developing"])
    .order("conviction", { ascending: false })
    .limit(6);

  if (error) throw error;
  const rows = (data ?? []) as {
    symbol: string;
    conviction: number;
    outcome: string;
    thesis: string | null;
    base_case_price: number | null;
  }[];

  if (rows.length === 0) return [];

  const symbols = rows.map((r) => r.symbol);
  const { data: snaps } = await db
    .from("ticker_snapshots")
    .select("symbol, last_price")
    .in("symbol", symbols);

  const prices = new Map(
    (snaps ?? []).map((s) => [s.symbol, s.last_price != null ? Number(s.last_price) : null])
  );

  return rows
    .filter((r) => ACTIVE_OUTCOMES.has(r.outcome))
    .map((r) => ({
      symbol: r.symbol,
      conviction: r.conviction,
      outcome: r.outcome,
      thesis: r.thesis,
      last_price: prices.get(r.symbol) ?? null,
      base_case_price: r.base_case_price != null ? Number(r.base_case_price) : null,
    }));
}
