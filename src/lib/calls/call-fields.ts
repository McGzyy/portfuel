/** Columns always present since initial schema. */
export const USER_CALL_SELECT_LEGACY =
  "id, symbol, asset_class, direction, thesis, called_at, return_pct, target_progress, entry_price, price_at_call, target_price, stop_price, last_price, timeframe_tag, vote_score, comment_count, is_fueled";

/** Peak + close columns (migration 20260623110000). */
export const USER_CALL_SELECT_EXTENDED = `${USER_CALL_SELECT_LEGACY}, peak_return_pct, closed_at, exit_price`;

/** Entry mode columns (migration 20260702100000). */
export const USER_CALL_SELECT_FULL = `${USER_CALL_SELECT_EXTENDED}, entry_mode, call_state, trigger_entry_price, expires_at`;

/** Member call row loaded for profile / overview (peak fields optional pre-migration). */
export type UserCallRow = {
  id: string;
  symbol: string;
  asset_class: "equity" | "crypto" | null;
  direction: "long" | "short";
  thesis: string;
  called_at: string;
  return_pct: number | null;
  target_progress: number | null;
  entry_price: number | null;
  price_at_call: number | null;
  target_price: number | null;
  stop_price: number | null;
  last_price: number | null;
  timeframe_tag: string | null;
  vote_score: number;
  comment_count: number;
  is_fueled: boolean;
  peak_return_pct?: number | null;
  closed_at?: string | null;
  exit_price?: number | null;
  entry_mode?: string | null;
  call_state?: string | null;
  trigger_entry_price?: number | null;
  expires_at?: string | null;
};

export function isMissingColumnDbError(error: {
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    msg.includes("does not exist") ||
    msg.includes("peak_return_pct") ||
    msg.includes("closed_at") ||
    msg.includes("exit_price") ||
    msg.includes("call_state") ||
    msg.includes("entry_mode") ||
    msg.includes("trigger_entry_price")
  );
}
