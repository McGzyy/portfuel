export type WatchlistEntry = {
  symbol: string;
  asset_class: "equity" | "crypto";
  created_at: string;
  baseline_price?: number | null;
  last_price?: number | null;
  return_pct?: number | null;
  /** % change from baseline_price to last_price */
  change_since_add_pct?: number | null;
};
