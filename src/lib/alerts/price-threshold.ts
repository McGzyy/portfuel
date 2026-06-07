import type { WatchlistAlertPrefs } from "@/lib/alerts/preferences";

export const PRICE_ALERT_PCT_OPTIONS = [3, 5, 7, 10, 15] as const;

export function resolvePriceMoveThreshold(
  globalPrefs: WatchlistAlertPrefs,
  opts: {
    symbolPriceAlertPct?: number | null;
    proUnlocked: boolean;
  }
): number | null {
  if (!globalPrefs.price_move) return null;

  const custom = opts.symbolPriceAlertPct;
  if (
    opts.proUnlocked &&
    custom != null &&
    custom >= 3 &&
    custom <= 20
  ) {
    return custom;
  }

  return globalPrefs.price_move_pct;
}
