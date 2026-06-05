export type WatchlistEntry = {
  symbol: string;
  asset_class: "equity" | "crypto";
  created_at: string;
  baseline_price?: number | null;
  last_price?: number | null;
  return_pct?: number | null;
  /** % change from baseline_price to last_price */
  change_since_add_pct?: number | null;
  /** Member calls on this symbol in the last 7 days */
  community_calls_7d?: number;
  /** Unread watchlist_call notification for this symbol */
  has_unread_call_alert?: boolean;
  /** Private journal conviction 1–10 */
  conviction?: number | null;
  /** Whether a private thesis is saved */
  has_thesis?: boolean;
  /** Private journal last update */
  journal_updated_at?: string | null;
};
