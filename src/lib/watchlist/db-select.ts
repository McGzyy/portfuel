/** Postgres / Supabase errors when prod schema lags behind app code. */
export function isSchemaDriftError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  if (code === "42703" || code === "42P01" || code === "PGRST204" || code === "PGRST205") {
    return true;
  }
  const msg = error.message ?? "";
  return /column .* does not exist|relation .* does not exist|could not find .* column|schema cache/i.test(
    msg
  );
}

export const WATCHLIST_FULL_SELECT =
  "symbol, asset_class, created_at, baseline_price, conviction, thesis, journal_updated_at, outcome, position_intent, catalysts, entry_price, target_price, risk_factors, price_alert_pct";

/** When position_intent column is missing but journal columns exist. */
export const WATCHLIST_JOURNAL_SELECT =
  "symbol, asset_class, created_at, baseline_price, conviction, thesis, journal_updated_at, outcome, catalysts, entry_price, target_price, risk_factors, price_alert_pct";

export const WATCHLIST_BASIC_SELECT = "symbol, asset_class, created_at, baseline_price";

export const JOURNAL_FULL_SELECT =
  "symbol, asset_class, created_at, baseline_price, thesis, conviction, entry_price, stop_price, target_price, entry_note, journal_updated_at, catalysts, risk_factors, personal_tags, outcome, position_intent, bull_case_price, base_case_price, bear_case_price";

export const JOURNAL_BASIC_SELECT = "symbol, asset_class, created_at, baseline_price";
