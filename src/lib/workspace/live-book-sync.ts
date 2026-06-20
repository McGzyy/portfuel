import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { refreshQuotesForSymbols } from "@/lib/calls/service";
import {
  summarizeOpenBook,
  type MemberBookCallRow,
  type MemberOpenBookSummary,
} from "@/lib/calls/member-book";
import { isDemoMode } from "@/lib/demo/config";
import { getDemoMemberCalls, getDemoProfileCalls } from "@/lib/demo/fixtures";
import { fetchUserRecentCalls } from "@/lib/users/profile";
import {
  liveBookPollMs,
  liveQuoteStaleAfterMs,
} from "@/lib/market/quote-cadence";

export type LiveCallMetrics = {
  id: string;
  symbol: string;
  last_price: number | null;
  return_pct: number | null;
  target_progress: number | null;
  peak_return_pct: number | null;
};

export type LiveBookSyncPayload = {
  fetchedAt: string;
  isPro: boolean;
  pollIntervalMs: number;
  staleAfterMs: number;
  quotesUpdated: number;
  openCount: number;
  calls: LiveCallMetrics[];
  summary: MemberOpenBookSummary | null;
  quoteErrors: string[];
};

function toLiveMetrics(c: MemberBookCallRow): LiveCallMetrics {
  return {
    id: c.id,
    symbol: c.symbol,
    last_price: c.last_price != null ? Number(c.last_price) : null,
    return_pct: c.return_pct != null ? Number(c.return_pct) : null,
    target_progress: c.target_progress != null ? Number(c.target_progress) : null,
    peak_return_pct:
      (c as { peak_return_pct?: number | null }).peak_return_pct != null
        ? Number((c as { peak_return_pct?: number | null }).peak_return_pct)
        : null,
  };
}

async function loadMemberCalls(userId: string): Promise<MemberBookCallRow[]> {
  if (isDemoMode()) {
    const demoMemberCalls = getDemoMemberCalls(userId, 80);
    if (demoMemberCalls.length > 0) return demoMemberCalls;
    return getDemoProfileCalls(userId).slice(0, 80);
  }
  return fetchUserRecentCalls(userId, 80);
}

/** Refresh open-call quotes and return lightweight metrics for client sync. */
export async function syncLiveBookForUser(
  userId: string,
  opts: { isPro: boolean; refreshQuotes?: boolean }
): Promise<LiveBookSyncPayload> {
  const pollIntervalMs = liveBookPollMs(opts.isPro);
  const staleAfterMs = liveQuoteStaleAfterMs(opts.isPro);
  const fetchedAt = new Date().toISOString();

  let allCalls = await loadMemberCalls(userId);
  let memberCalls = allCalls.filter((c) => !c.is_fueled);
  let openCalls = memberCalls.filter((c) => isOpenMemberCall(c));

  if (openCalls.length === 0) {
    return {
      fetchedAt,
      isPro: opts.isPro,
      pollIntervalMs,
      staleAfterMs,
      quotesUpdated: 0,
      openCount: 0,
      calls: [],
      summary: null,
      quoteErrors: [],
    };
  }

  let quotesUpdated = 0;
  let quoteErrors: string[] = [];

  if (opts.refreshQuotes !== false && !isDemoMode()) {
    const symbols = [...new Set(openCalls.map((c) => c.symbol.toUpperCase()))];
    try {
      const result = await refreshQuotesForSymbols(symbols);
      quotesUpdated = result.updated;
      quoteErrors = result.quotes
        .filter((q) => q.lastPrice == null)
        .map((q) => q.symbol);
      allCalls = await loadMemberCalls(userId);
      memberCalls = allCalls.filter((c) => !c.is_fueled);
      openCalls = memberCalls.filter((c) => isOpenMemberCall(c));
    } catch (e) {
      console.error("[live-book-sync]", e);
    }
  }

  return {
    fetchedAt,
    isPro: opts.isPro,
    pollIntervalMs,
    staleAfterMs,
    quotesUpdated,
    openCount: openCalls.length,
    calls: openCalls.map(toLiveMetrics),
    summary: summarizeOpenBook(openCalls),
    quoteErrors,
  };
}
