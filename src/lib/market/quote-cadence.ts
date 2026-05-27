/** Delayed quote cadence used by cron refresh and workspace pulse. */
export const QUOTES_REFRESH_MINUTES = 15;

export function quotesRefreshLabel(minutes = QUOTES_REFRESH_MINUTES): string {
  return `Quotes refresh every ${minutes} minutes`;
}
