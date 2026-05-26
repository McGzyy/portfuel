import type { TickerIntel } from "@/lib/market/ticker-intel";

export type IntelTeaserSummary = {
  headlineCount: number;
  earningsCount: number;
  filingsCount: number;
  hasProfile: boolean;
  latestHeadline: string | null;
  latestHeadlineSource: string | null;
};

export function buildIntelTeaserSummary(intel: TickerIntel): IntelTeaserSummary {
  const latest = intel.news[0];
  return {
    headlineCount: intel.news.length,
    earningsCount: intel.earnings.length,
    filingsCount: intel.filings.length,
    hasProfile: Boolean(intel.profile),
    latestHeadline: latest?.headline ?? null,
    latestHeadlineSource: latest?.source ?? null,
  };
}
