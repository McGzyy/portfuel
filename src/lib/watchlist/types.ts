export type WatchlistEntry = {
  symbol: string;
  asset_class: "equity" | "crypto";
  created_at: string;
  last_price?: number | null;
  return_pct?: number | null;
};
