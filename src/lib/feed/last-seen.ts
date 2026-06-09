import { parseAppTimestamp } from "@/lib/time/timestamp";

export const FEED_SEEN_COOKIE = "pf_feed_seen_at";

export function parseFeedSeenAt(cookieValue: string | undefined): number {
  if (!cookieValue) return 0;
  const n = Number(cookieValue);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function isCallNewSinceSeen(calledAt: string, seenAtMs: number): boolean {
  if (!seenAtMs) return false;
  return parseAppTimestamp(calledAt).getTime() > seenAtMs;
}
