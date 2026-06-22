import { Suspense, cache } from "react";
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
import { loadFeedCalls, mapFeedCallsForCard } from "@/lib/dashboard/data";
import {
  fetchLatestSnapshotUpdatedAt,
  fetchSnapshotUpdatedAtBySymbol,
} from "@/lib/market/quote-freshness";
import { fetchWatchlist } from "@/lib/watchlist/service";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import type { SessionPayload } from "@/lib/auth/session-types";
import type { CallCardData } from "@/components/calls/CallCard";
import { FeedBodySkeleton, FeedChromeSkeleton } from "@/components/dashboard/FeedPageLoadingSkeleton";

export type FeedPageParams = {
  mode: FeedTab;
  feedFilter: FeedFilter;
  searchQuery: string;
  showNewOnly: boolean;
};

type FeedRawData = {
  fueledCalls: Awaited<ReturnType<typeof loadFeedCalls>>;
  fueledFeedCards: Awaited<ReturnType<typeof loadFeedCalls>>;
  filteredCalls: Awaited<ReturnType<typeof loadFeedCalls>>;
  feedSeenAt: number;
};

type FeedBodyData = FeedRawData & {
  fueledMapped: CallCardData[];
  mapped: CallCardData[];
  newCount: number;
  feedSummary: ReturnType<typeof summarizeFeed>;
  hotTickers: ReturnType<typeof getHotTickersFromCalls>;
  topSymbol: string | null;
  topReturnPct: number | null;
  quotesUpdatedAt: string | null;
  quoteUpdatedAtBySymbol: Record<string, string>;
  showLeadersPanel: boolean;
};

const loadFeedRaw = cache(async function loadFeedRaw(
  session: SessionPayload,
  params: FeedPageParams
): Promise<FeedRawData> {
  const { mode, feedFilter, searchQuery } = params;
  const allFeedCalls = await loadFeedCalls(mode === "progress" ? "latest" : mode);
  const fueledFeedCards = allFeedCalls.filter((c) => c.is_fueled).slice(0, 4);
  const fueledCalls = allFeedCalls.filter((c) => c.is_fueled);
  let memberCalls = allFeedCalls.filter((c) => !c.is_fueled);

  if (feedFilter === "following") {
    const followingIds = new Set(await fetchFollowingIds(session.userId));
    memberCalls = filterCallsByFollowing(memberCalls, followingIds);
  }

  let filteredCalls =
    feedFilter === "fueled"
      ? fueledCalls
      : filterCallsFeed(memberCalls, feedFilter === "following" ? "all" : feedFilter);
  filteredCalls = filterCallsBySearch(filteredCalls, searchQuery);
  if (mode === "progress") {
    filteredCalls = sortCallsByTargetProgress(filteredCalls);
  }

  const cookieStore = await cookies();
  const feedSeenAt = parseFeedSeenAt(cookieStore.get(FEED_SEEN_COOKIE)?.value);

  return {
    fueledCalls,
    fueledFeedCards,
    filteredCalls,
    feedSeenAt,
  };
});

const loadFeedBody = cache(async function loadFeedBody(
  session: SessionPayload,
  params: FeedPageParams
): Promise<FeedBodyData> {
  const { mode, feedFilter, showNewOnly } = params;
  const raw = await loadFeedRaw(session, params);

  const hypeScores = await fetchHypeScoresBySymbols([
    ...raw.filteredCalls.map((c) => c.symbol),
    ...raw.fueledFeedCards.map((c) => c.symbol),
  ]);

  const fueledMapped =
    feedFilter === "fueled"
      ? []
      : await mapFeedCallsForCard(raw.fueledFeedCards, hypeScores);
  let mapped = await mapFeedCallsForCard(raw.filteredCalls, hypeScores);
  const newCount = mapped.filter((c) => isCallNewSinceSeen(c.called_at, raw.feedSeenAt)).length;
  if (showNewOnly) {
    mapped = mapped.filter((c) => isCallNewSinceSeen(c.called_at, raw.feedSeenAt));
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

  const quoteSymbols = [
    ...mapped.map((c) => c.symbol),
    ...fueledMapped.map((c) => c.symbol),
  ];
  const [quotesUpdatedAt, quoteUpdatedAtBySymbol] = await Promise.all([
    fetchLatestSnapshotUpdatedAt(quoteSymbols),
    fetchSnapshotUpdatedAtBySymbol(quoteSymbols),
  ]);

  return {
    ...raw,
    fueledMapped,
    mapped,
    newCount,
    feedSummary,
    hotTickers,
    topSymbol,
    topReturnPct,
    quotesUpdatedAt,
    quoteUpdatedAtBySymbol,
    showLeadersPanel: mapped.length >= 3 && mode !== "progress",
  };
});

function proFlags(session: SessionPayload) {
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  return { proLocked, proGateCta: getProGateCta(proContext), isPro: !proLocked };
}

async function FeedContextRailSection({
  session,
  params,
}: {
  session: SessionPayload;
  params: FeedPageParams;
}) {
  const { isPro } = proFlags(session);
  const data = await loadFeedBody(session, params);

  return (
    <FeedContextRail
      summary={data.feedSummary}
      newCount={data.newCount}
      hotTickers={data.hotTickers}
      topSymbol={data.topSymbol}
      topReturnPct={data.topReturnPct}
      quotesUpdatedAt={data.quotesUpdatedAt}
      isPro={isPro}
    />
  );
}

async function FeedChromeSection({
  session,
  params,
}: {
  session: SessionPayload;
  params: FeedPageParams;
}) {
  const { proLocked, isPro } = proFlags(session);
  const { mode, feedFilter, searchQuery, showNewOnly } = params;

  const [raw, weeklyQuota, watchlist] = await Promise.all([
    loadFeedRaw(session, params),
    fetchWeeklyQuotaStatus(session.userId, session.membershipTier ?? null),
    fetchWatchlist(session.userId).catch(() => [] as Awaited<ReturnType<typeof fetchWatchlist>>),
  ]);

  const resultCount = raw.filteredCalls.length;
  const newCount = raw.filteredCalls.filter((c) =>
    isCallNewSinceSeen(c.called_at, raw.feedSeenAt)
  ).length;

  return (
    <>
      <FeedCommandHeader
        resultCount={resultCount}
        mode={mode}
        newCount={newCount}
        showNewOnly={showNewOnly}
        isPro={isPro}
      />
      <WorkspaceLivePulse userId={session.userId} isPro={isPro} />
      <MemberQuotaStrip quota={weeklyQuota} showUpgrade={proLocked} />
      {proLocked ? (
        <ProIntelDiscoverStrip watchlistSymbols={watchlist.map((w) => w.symbol)} />
      ) : null}
      <FeedToolbar
        mode={mode}
        feedFilter={feedFilter}
        searchQuery={searchQuery}
        newCount={newCount}
        showNewOnly={showNewOnly}
        fueledCount={raw.fueledCalls.length}
      />
    </>
  );
}

async function FeedBodySection({
  session,
  params,
}: {
  session: SessionPayload;
  params: FeedPageParams;
}) {
  const { proLocked, proGateCta, isPro } = proFlags(session);
  const { mode, feedFilter, showNewOnly } = params;
  const data = await loadFeedBody(session, params);

  return (
    <div className="pf-feed-body space-y-4 sm:space-y-6">
      <FeedVisitTracker />

      {data.fueledMapped.length > 0 && feedFilter !== "fueled" ? (
        <FueledDeskSection
          calls={data.fueledMapped}
          viewerUserId={session.userId}
          isAdmin={session.role === "admin"}
          quoteUpdatedAtBySymbol={data.quoteUpdatedAtBySymbol}
          isPro={isPro}
        />
      ) : null}

      {data.feedSummary.count > 0 ? (
        <FeedSummaryBar
          summary={data.feedSummary}
          mode={mode}
          proLocked={proLocked}
          proGateCta={proGateCta}
        />
      ) : null}

      {data.showLeadersPanel ? (
        <ProFeedLeadersPanel calls={data.mapped} locked={proLocked} proGateCta={proGateCta} />
      ) : null}

      <section aria-label="Community calls">
        {data.mapped.length === 0 ? (
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
            calls={data.mapped}
            feedSeenAt={data.feedSeenAt}
            proLocked={proLocked}
            viewerUserId={session.userId}
            isAdmin={session.role === "admin"}
            quoteUpdatedAtBySymbol={data.quoteUpdatedAtBySymbol}
          />
        )}
      </section>
    </div>
  );
}

export function FeedPageLoader({
  session,
  params,
}: {
  session: SessionPayload;
  params: FeedPageParams;
}) {
  return (
    <WorkspaceContextShell
      pulseLabel="Feed pulse"
      rail={
        <Suspense fallback={null}>
          <FeedContextRailSection session={session} params={params} />
        </Suspense>
      }
      mainClassName="space-y-4 pb-14 sm:space-y-6 lg:pb-0"
    >
      <Suspense fallback={<FeedChromeSkeleton />}>
        <FeedChromeSection session={session} params={params} />
      </Suspense>
      <Suspense fallback={<FeedBodySkeleton />}>
        <FeedBodySection session={session} params={params} />
      </Suspense>
    </WorkspaceContextShell>
  );
}
