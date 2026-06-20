/** Global cron + member default quote cadence (minutes). */
export const QUOTES_REFRESH_MINUTES = 15;

/** Pro client polling cadence while on ticker / watchlist / open book. */
export const PRO_QUOTES_REFRESH_MINUTES = 3;

export const PRO_QUOTES_POLL_MS = PRO_QUOTES_REFRESH_MINUTES * 60_000;

/** In-place live updates for open calls on overview / positions (Pro). */
export const PRO_LIVE_BOOK_POLL_MS = 45_000;

/** In-place live updates for standard members on open book surfaces. */
export const STANDARD_LIVE_BOOK_POLL_MS = 120_000;

export function liveBookPollMs(isPro: boolean): number {
  return isPro ? PRO_LIVE_BOOK_POLL_MS : STANDARD_LIVE_BOOK_POLL_MS;
}

/** When last fetch is older than this, show a stale quote indicator. */
export function liveQuoteStaleAfterMs(isPro: boolean): number {
  return isPro ? PRO_LIVE_BOOK_POLL_MS * 2.5 : STANDARD_LIVE_BOOK_POLL_MS * 2;
}

export function quotesRefreshMinutesForTier(isPro: boolean): number {
  return isPro ? PRO_QUOTES_REFRESH_MINUTES : QUOTES_REFRESH_MINUTES;
}

export function quotesRefreshLabel(opts?: { minutes?: number; isPro?: boolean }): string {
  const minutes = opts?.minutes ?? quotesRefreshMinutesForTier(Boolean(opts?.isPro));
  if (opts?.isPro) {
    return `Pro quotes · refresh every ${minutes} minutes while you're here`;
  }
  return `Quotes refresh every ${minutes} minutes`;
}
