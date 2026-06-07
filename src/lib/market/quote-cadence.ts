/** Global cron + member default quote cadence (minutes). */
export const QUOTES_REFRESH_MINUTES = 15;

/** Pro client polling cadence while on ticker / watchlist / open book. */
export const PRO_QUOTES_REFRESH_MINUTES = 3;

export const PRO_QUOTES_POLL_MS = PRO_QUOTES_REFRESH_MINUTES * 60_000;

export function quotesRefreshMinutesForTier(isPro: boolean): number {
  return isPro ? PRO_QUOTES_REFRESH_MINUTES : QUOTES_REFRESH_MINUTES;
}

export function quotesRefreshLabel(opts?: { minutes?: number; isPro?: boolean }): string {
  const minutes = opts?.minutes ?? quotesRefreshMinutesForTier(Boolean(opts?.isPro));
  if (opts?.isPro) {
    return `Pro live quotes · refresh every ${minutes} minutes while you're here`;
  }
  return `Quotes refresh every ${minutes} minutes`;
}
