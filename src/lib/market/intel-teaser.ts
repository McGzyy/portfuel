import type { TickerIntel } from "@/lib/market/ticker-intel";
import { computeCandleReturnWindows } from "@/lib/market/candle-returns";
import { summarizeTickerCommunity } from "@/lib/calls/ticker-community-stats";

export type IntelTeaserSummary = {
  headlineCount: number;
  earningsCount: number;
  filingsCount: number;
  hasProfile: boolean;
  latestHeadline: string | null;
  latestHeadlineSource: string | null;
  /** Crypto Pro preview */
  return30d: number | null;
  communityCallCount: number;
};

export function buildIntelTeaserSummary(intel: TickerIntel): IntelTeaserSummary {
  const latest = intel.news[0];
  const returns = computeCandleReturnWindows(intel.candles);
  const community = summarizeTickerCommunity(intel.calls);
  return {
    headlineCount: intel.news.length,
    earningsCount: intel.earnings.length,
    filingsCount: intel.filings.length,
    hasProfile: Boolean(intel.profile),
    latestHeadline: latest?.headline ?? null,
    latestHeadlineSource: latest?.source ?? null,
    return30d: returns.d30,
    communityCallCount: community.callCount,
  };
}
