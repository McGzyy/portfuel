export const RESEARCH_SEEN_COOKIE = "pf_research_seen_at";

export function parseResearchSeenAt(cookieValue: string | undefined): number {
  if (!cookieValue) return 0;
  const n = Number(cookieValue);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
