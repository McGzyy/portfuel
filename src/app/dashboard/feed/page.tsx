import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FeedCallList } from "@/components/dashboard/FeedCallList";
import { FueledDeskSection } from "@/components/dashboard/FueledDeskSection";
import { FeedCommandHeader } from "@/components/dashboard/FeedCommandHeader";
import { WorkspaceLivePulse } from "@/components/dashboard/WorkspaceLivePulse";
import { FeedToolbar } from "@/components/dashboard/FeedToolbar";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { ProFeedLeadersPanel } from "@/components/pro/ProFeedLeadersPanel";
import { ProIntelDiscoverStrip } from "@/components/pro/ProIntelDiscoverStrip";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import {
  filterCallsFeed,
  filterCallsByFollowing,
  filterCallsBySearch,
  sortCallsByTargetProgress,
  type FeedFilter,
} from "@/lib/calls/filter-feed";
import type { FeedTab } from "@/lib/dashboard/nav";
import { FeedContextRail } from "@/components/dashboard/FeedContextRail";
import { FeedVisitTracker } from "@/components/dashboard/FeedVisitTracker";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { MemberQuotaStrip } from "@/components/member/MemberQuotaStrip";
import { fetchWeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { fetchFollowingIds } from "@/lib/follows/service";
import {
  FEED_SEEN_COOKIE,
  isCallNewSinceSeen,
  parseFeedSeenAt,
} from "@/lib/feed/last-seen";
import { CallsEmptyState } from "@/components/calls/CallsEmptyState";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { loadFeedCalls, mapCallForCard, mapFeedCallsForCard, requireDashboardSession } from "@/lib/dashboard/data";
import { fetchLatestSnapshotUpdatedAt } from "@/lib/market/quote-freshness";
import { fetchWatchlist } from "@/lib/watchlist/service";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Member feed",
};

function parseFilter(raw?: string): FeedFilter {
  if (
    raw === "fueled" ||
    raw === "equity" ||
    raw === "crypto" ||
    raw === "following"
  ) {
    return raw;
  }
  return "all";
}

export default async function DashboardFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string; new?: string }>;
}) {
  function parseTab(raw?: string): FeedTab {
    if (raw === "performing" || raw === "progress") return raw;
    return "latest";
  }
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  const { tab, filter: filterParam, q, new: newParam } = await searchParams;
  const showNewOnly = newParam === "1";
  const mode = parseTab(tab);
  const feedFilter = parseFilter(filterParam);
  const searchQuery = q?.trim() ?? "";

  const allFeedCalls = await loadFeedCalls(mode === "progress" ? "latest" : mode);
  const fueledFeedCards = allFeedCalls
    .filter((c) => c.is_fueled)
    .slice(0, 4);
  const fueledCalls = allFeedCalls.filter((c) => c.is_fueled);
  let memberCalls = allFeedCalls.filter((c) => !c.is_fueled);

  if (feedFilter === "following") {
    const followingIds = new Set(await fetchFollowingIds(session.userId));
    memberCalls = filterCallsByFollowing(memberCalls, followingIds);
    // Fueled desk calls are house research — not filtered by follow graph.
  }

  let calls =
    feedFilter === "fueled"
      ? fueledCalls
      : filterCallsFeed(
          memberCalls,
          feedFilter === "following" ? "all" : feedFilter
        );
  calls = filterCallsBySearch(calls, searchQuery);
  if (mode === "progress") {
    calls = sortCallsByTargetProgress(calls);
  }
  const hypeScores = await fetchHypeScoresBySymbols([
    ...calls.map((c) => c.symbol),
    ...fueledFeedCards.map((c) => c.symbol),
  ]);
  const cookieStore = await cookies();
  const feedSeenAt = parseFeedSeenAt(cookieStore.get(FEED_SEEN_COOKIE)?.value);
  const fueledMapped =
    feedFilter === "fueled"
      ? []
      : await mapFeedCallsForCard(fueledFeedCards, hypeScores);
  let mapped = await mapFeedCallsForCard(calls, hypeScores);
  const newCount = mapped.filter((c) => isCallNewSinceSeen(c.called_at, feedSeenAt)).length;
  if (showNewOnly) {
    mapped = mapped.filter((c) => isCallNewSinceSeen(c.called_at, feedSeenAt));
  }
  const feedSummary = summarizeFeed(mapped);
  const hotTickers = getHotTickersFromCalls(
    mapped.map((c) => ({ symbol: c.symbol, return_pct: c.return_pct })),
    5
  );
  let topSymbol: string | null = null;
  let topReturnPct: number | null = null;
  for (const c of mapped) {
    if (c.return_pct == null) continue;
    if (topReturnPct == null || c.return_pct > topReturnPct) {
      topReturnPct = c.return_pct;
      topSymbol = c.symbol;
    }
  }
  const weeklyQuota = await fetchWeeklyQuotaStatus(
    session.userId,
    session.membershipTier ?? null
  );

  const showLeadersPanel = mapped.length >= 3 && mode !== "progress";

  let watchlistSymbols: string[] = [];
  try {
    const wl = await fetchWatchlist(session.userId);
    watchlistSymbols = wl.map((w) => w.symbol);
  } catch {
    /* optional */
  }

  const quoteSymbols = [
    ...mapped.map((c) => c.symbol),
    ...fueledMapped.map((c) => c.symbol),
  ];
  const quotesUpdatedAt = await fetchLatestSnapshotUpdatedAt(quoteSymbols);

  return (
    <WorkspaceContextShell
      pulseLabel="Feed pulse"
      rail={
        <FeedContextRail
          summary={feedSummary}
          newCount={newCount}
          hotTickers={hotTickers}
          topSymbol={topSymbol}
          topReturnPct={topReturnPct}
          quotesUpdatedAt={quotesUpdatedAt}
          isPro={!proLocked}
        />
      }
      mainClassName="space-y-4 pb-14 sm:space-y-6 lg:pb-0"
    >
      <FeedCommandHeader
        resultCount={mapped.length}
        mode={mode}
        newCount={newCount}
        showNewOnly={showNewOnly}
        quotesUpdatedAt={quotesUpdatedAt}
        isPro={!proLocked}
      />

      <WorkspaceLivePulse userId={session.userId} isPro={!proLocked} />

      <MemberQuotaStrip quota={weeklyQuota} showUpgrade={proLocked} />

      {proLocked ? <ProIntelDiscoverStrip watchlistSymbols={watchlistSymbols} /> : null}

      <FeedToolbar
        mode={mode}
        feedFilter={feedFilter}
        searchQuery={searchQuery}
        newCount={newCount}
        showNewOnly={showNewOnly}
        fueledCount={fueledCalls.length}
      />

      <div className="pf-feed-body space-y-4 sm:space-y-6">
        <FeedVisitTracker />

        {fueledMapped.length > 0 && feedFilter !== "fueled" ? (
          <FueledDeskSection
            calls={fueledMapped}
            viewerUserId={session.userId}
            isAdmin={session.role === "admin"}
          />
        ) : null}

        {feedSummary.count > 0 ? (
          <FeedSummaryBar
            summary={feedSummary}
            mode={mode}
            proLocked={proLocked}
            proGateCta={proGateCta}
          />
        ) : null}

        {showLeadersPanel ? (
          <ProFeedLeadersPanel calls={mapped} locked={proLocked} proGateCta={proGateCta} />
        ) : null}

        <section aria-label="Community calls">
          {mapped.length === 0 ? (
            <CallsEmptyState
              title="No calls match this view"
              description={
                showNewOnly
                  ? "No new calls match this filter — clear “new only” or check back after members publish."
                  : feedFilter === "following"
                    ? "Follow members from rankings or their profile to personalize this feed."
                    : feedFilter === "fueled"
                      ? "No Fueled desk calls in this window yet — house theses appear here when published."
                      : "Try a different tab, filter, or search — or publish a new thesis."
              }
              showPublishCta={feedFilter !== "following"}
              secondaryHref={
                feedFilter === "following" ? "/dashboard/rankings" : "/dashboard/watchlist"
              }
              secondaryLabel={
                feedFilter === "following" ? "Browse rankings" : "Open watchlist"
              }
            />
          ) : (
            <FeedCallList
              calls={mapped}
              feedSeenAt={feedSeenAt}
              proLocked={proLocked}
              viewerUserId={session.userId}
              isAdmin={session.role === "admin"}
            />
          )}
        </section>
      </div>
    </WorkspaceContextShell>
  );
}
