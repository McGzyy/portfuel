import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OverviewActivityPanels } from "@/components/dashboard/OverviewActivityPanels";
import { WorkspaceOverviewStats } from "@/components/dashboard/WorkspaceOverviewStats";
import { WorkspaceCommandHeader } from "@/components/dashboard/WorkspaceCommandHeader";
import { OpenCallsPanel } from "@/components/dashboard/OpenCallsPanel";
import { CallsEmptyState } from "@/components/calls/CallsEmptyState";
import { FeedNewBannerLive } from "@/components/dashboard/FeedNewBannerLive";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { fetchWeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { OverviewReturnHeroSection } from "@/components/dashboard/OverviewReturnHeroSection";
import { OverviewReturnHeroSkeleton } from "@/components/dashboard/OverviewReturnHeroSkeleton";
import { OverviewCommunityPulse } from "@/components/dashboard/OverviewCommunityPulse";
import { AdminDiscoveryOverviewStrip } from "@/components/dashboard/AdminDiscoveryOverviewStrip";
import { ShareTrackRecordCard } from "@/components/profile/ShareTrackRecordCard";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import type { CallCardData } from "@/components/calls/CallCard";
import type { fetchUserRecentCalls } from "@/lib/users/profile";
import {
  loadFeedCalls,
  loadMemberStats,
  mapCallForCard,
  requireDashboardSession,
} from "@/lib/dashboard/data";
import { fetchDiscoveryOriginCallIds } from "@/lib/desk-discovery/call-origin";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { fetchFollowingIds, fetchFollowingMembers } from "@/lib/follows/service";
import { filterCallsByFollowing } from "@/lib/calls/filter-feed";
import { fetchWatchlist } from "@/lib/watchlist/service";
import {
  OverviewDeferredPanels,
  OverviewDeferredSkeleton,
} from "@/components/dashboard/OverviewDeferredPanels";
import { fetchLatestSnapshotUpdatedAt, fetchSnapshotUpdatedAtBySymbol } from "@/lib/market/quote-freshness";
import { OverviewContextRail } from "@/components/dashboard/OverviewContextRail";
import { OverviewLayoutProvider } from "@/components/dashboard/OverviewLayoutProvider";
import { OverviewLayoutBar } from "@/components/dashboard/OverviewLayoutBar";
import { OverviewPublishFab } from "@/components/dashboard/OverviewPublishFab";
import { OverviewLayoutBody } from "@/components/dashboard/OverviewLayoutBody";
import { OverviewPanelGate } from "@/components/dashboard/OverviewPanelGate";
import { loadWorkspaceActivitySnapshot } from "@/lib/workspace/activity-snapshot";

export const metadata: Metadata = {
  title: "Overview",
};

export const dynamic = "force-dynamic";

type OwnCallRow = Awaited<ReturnType<typeof fetchUserRecentCalls>>[number];

function toOwnStripCard(
  c: OwnCallRow,
  username: string,
  displayName: string | null,
  userId: string,
  avatarUrl?: string | null
): CallCardData {
  return mapUserCallRowToCard(c, { userId, username, displayName, avatarUrl });
}

function toPreview(c: ReturnType<typeof mapCallForCard>): CallPreviewData {
  return {
    id: c.id,
    symbol: c.symbol,
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    display_name: c.display_name,
    username: c.username,
    is_fueled: c.is_fueled,
    entry_price: c.entry_price,
    last_price: c.last_price,
  };
}

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  if (params.tab || params.filter || params.q) {
    const qs = new URLSearchParams();
    if (params.tab) qs.set("tab", params.tab);
    if (params.filter) qs.set("filter", params.filter);
    if (params.q) qs.set("q", params.q);
    redirect(`/dashboard/feed?${qs.toString()}`);
  }

  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);

  const [
    memberStats,
    performingRaw,
    latestRaw,
    ownProfile,
    weeklyQuota,
    followingMembers,
    followingIdsList,
    watchlistItems,
  ] = await Promise.all([
    loadMemberStats(session.userId),
    loadFeedCalls("performing"),
    loadFeedCalls("latest"),
    fetchOwnProfile(session),
    fetchWeeklyQuotaStatus(session.userId, session.membershipTier ?? null),
    fetchFollowingMembers(session.userId),
    fetchFollowingIds(session.userId),
    fetchWatchlist(session.userId).catch(() => [] as Awaited<ReturnType<typeof fetchWatchlist>>),
  ]);
  const ownCalls = ownProfile.calls;
  const followingIds = new Set(followingIdsList);

  const hypeScores = await fetchHypeScoresBySymbols([
    ...performingRaw.map((c) => c.symbol),
    ...latestRaw.map((c) => c.symbol),
    ...ownCalls.map((c) => c.symbol),
  ]);
  const discoveryCallIds = await fetchDiscoveryOriginCallIds([
    ...performingRaw.map((c) => c.id),
    ...latestRaw.map((c) => c.id),
  ]);
  const performingCalls = performingRaw.map((c) =>
    mapCallForCard(c, hypeScores, discoveryCallIds)
  );
  const latestCalls = latestRaw.map((c) => mapCallForCard(c, hypeScores, discoveryCallIds));
  const communityPulse = summarizeFeed(performingCalls);
  const performingHotTickers = getHotTickersFromCalls(
    performingCalls.map((c) => ({ symbol: c.symbol, return_pct: c.return_pct })),
    8
  );
  const hotTickers = getHotTickersFromCalls(
    latestCalls.map((c) => ({ symbol: c.symbol, return_pct: c.return_pct })),
    8
  );

  const followingPreviews = filterCallsByFollowing(latestRaw, followingIds)
    .slice(0, 4)
    .map((c) => toPreview(mapCallForCard(c, hypeScores)));

  const latestPreviews = latestCalls
    .filter((c) => !c.is_fueled)
    .slice(0, 5)
    .map((c) => toPreview(c));

  const fueledCalls = latestCalls.filter((c) => c.is_fueled);
  const fueledPreviews = fueledCalls.slice(0, 3).map((c) => toPreview(c));
  const featuredDesk = fueledPreviews[0] ?? null;

  const isPro = !proLocked;

  const watchlistCount = watchlistItems.length;
  const journalThesisCount = watchlistItems.filter((i) => i.has_thesis).length;
  const watchlistPreview = watchlistItems.slice(0, 6);

  const ownCallCards = ownCalls.map((c) =>
    toOwnStripCard(
      c,
      session.username,
      session.displayName,
      session.userId,
      ownProfile.member?.avatar_url ?? null
    )
  );
  const openCallCards = ownCallCards.filter((c) => {
    const row = ownCalls.find((r) => r.id === c.id);
    return row ? isOpenMemberCall(row) : true;
  });
  const pendingEntryCount = openCallCards.filter(
    (c) => c.call_state === "pending_entry"
  ).length;

  const displayLabel = session.displayName ?? session.username;
  const previewQuoteSymbols = [
    ...new Set([
      ...latestPreviews.map((p) => p.symbol),
      ...followingPreviews.map((p) => p.symbol),
    ]),
  ];
  const [{ feedNewCount, dmUnread, notifUnread }, quotesUpdatedAt, quoteUpdatedAtBySymbol] =
    await Promise.all([
      loadWorkspaceActivitySnapshot(session.userId),
      fetchLatestSnapshotUpdatedAt([
        ...openCallCards.map((c) => c.symbol),
        ...watchlistItems.map((w) => w.symbol),
        ...previewQuoteSymbols,
      ]).catch(() => null),
      fetchSnapshotUpdatedAtBySymbol([
        ...openCallCards.map((c) => c.symbol),
        ...previewQuoteSymbols,
      ]).catch(() => ({})),
    ]);

  return (
    <OverviewLayoutProvider userId={session.userId}>
      <OverviewLayoutBody
        rail={
          <OverviewContextRail
            openCallsCount={openCallCards.length}
            pendingEntryCount={pendingEntryCount}
            winRate={memberStats?.win_rate}
            rankScore={memberStats?.rank_score != null ? Number(memberStats.rank_score) : null}
            communityPulse={communityPulse}
            hotTickers={performingHotTickers}
            watchlistPreview={watchlistPreview}
            isAdmin={session.role === "admin"}
            isPro={isPro}
            dmUnread={dmUnread}
            notifUnread={notifUnread}
            feedNewCount={feedNewCount}
            quotesUpdatedAt={quotesUpdatedAt}
          />
        }
      >
      <WorkspaceCommandHeader
        displayName={displayLabel}
        username={session.username}
        openCallsCount={openCallCards.length}
        pendingEntryCount={pendingEntryCount}
        isAdmin={session.role === "admin"}
        isPro={isPro}
      />

      <OverviewLayoutBar />

      {feedNewCount > 0 ? (
        <FeedNewBannerLive
          initialCount={feedNewCount}
          mode="latest"
          feedFilter="all"
          searchQuery=""
          showNewOnly={false}
        />
      ) : null}

      <OverviewPanelGate panelId="hero">
        <Suspense fallback={<OverviewReturnHeroSkeleton />}>
          <OverviewReturnHeroSection
            ownCalls={ownCalls}
            profileHref={`/member/${session.username}`}
            winRate={memberStats?.win_rate}
            rankScore={memberStats?.rank_score != null ? Number(memberStats.rank_score) : null}
            publishedCallCount={Math.max(ownCalls.length, memberStats?.calls_count ?? 0)}
            member={ownProfile.member}
          />
        </Suspense>
      </OverviewPanelGate>

      <OverviewPanelGate panelId="stats">
      <WorkspaceOverviewStats
        username={session.username}
        winRate={memberStats?.win_rate}
        rankScore={memberStats?.rank_score != null ? Number(memberStats.rank_score) : null}
        callsCount={memberStats?.calls_count}
        quota={weeklyQuota}
        watchlistCount={watchlistCount}
        watchlistThesisCount={journalThesisCount}
      />
      </OverviewPanelGate>

      <OverviewPanelGate panelId="activity">
      <div className="space-y-4">
        <OverviewActivityPanels hotTickers={hotTickers} />
        <OverviewCommunityPulse
          summary={communityPulse}
          proLocked={proLocked}
          proGateCta={proGateCta}
        />
      </div>
      </OverviewPanelGate>

      {session.role === "admin" ? <AdminDiscoveryOverviewStrip /> : null}

      <OverviewPanelGate panelId="open_calls">
      {openCallCards.length > 0 ? (
        <OpenCallsPanel
          calls={openCallCards}
          viewerUserId={session.userId}
          isAdmin={session.role === "admin"}
          username={session.username}
          isPro={isPro}
          proLocked={proLocked}
          quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
        />
      ) : (
        <CallsEmptyState
          title="No open calls"
          description="Your book is clear. Publish a new thesis or review closed positions on your profile."
          secondaryHref="/dashboard/book"
          secondaryLabel="View positions"
        />
      )}
      </OverviewPanelGate>

      <OverviewPanelGate panelId="track_record">
      {ownCalls.length > 0 ? (
        <ShareTrackRecordCard
          username={session.username}
          callCount={Math.max(ownCalls.length, memberStats?.calls_count ?? 0)}
          winRatePct={memberStats?.win_rate ?? null}
          avgReturnPct={
            memberStats?.avg_return_pct != null ? Number(memberStats.avg_return_pct) : null
          }
        />
      ) : null}
      </OverviewPanelGate>

      <Suspense fallback={<OverviewDeferredSkeleton />}>
        <OverviewDeferredPanels
          session={session}
          isPro={isPro}
          proLocked={proLocked}
          ownCalls={ownCalls}
          openCallCards={openCallCards}
          latestPreviews={latestPreviews}
          followingPreviews={followingPreviews}
          followingMembers={followingMembers}
          fueledCallsCount={fueledCalls.length}
          featuredDesk={featuredDesk}
          watchlistItems={watchlistItems}
          communityPulse={communityPulse}
          quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
        />
      </Suspense>
      </OverviewLayoutBody>
      <OverviewPublishFab />
    </OverviewLayoutProvider>
  );
}
