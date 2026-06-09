/** Columns always present since initial schema. */
export const USER_CALL_SELECT_LEGACY =
  "id, symbol, asset_class, direction, thesis, called_at, return_pct, target_progress, entry_price, price_at_call, target_price, stop_price, last_price, timeframe_tag, vote_score, comment_count, is_fueled";

/** Peak + close columns (migration 20260623110000). */
export const USER_CALL_SELECT_EXTENDED = `${USER_CALL_SELECT_LEGACY}, peak_return_pct, closed_at, exit_price`;

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
    msg.includes("exit_price")
  );
}
