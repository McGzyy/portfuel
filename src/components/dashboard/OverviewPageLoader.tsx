import { Suspense } from "react";
import { cache } from "react";
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
import { loadFeedCalls, mapCallForCard } from "@/lib/dashboard/data";
import { fetchDiscoveryOriginCallIds } from "@/lib/desk-discovery/call-origin";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
import { summarizeFeed, type FeedSummary } from "@/lib/calls/feed-summary";
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
import { OverviewProCommandSectionLoader } from "@/components/dashboard/OverviewProCommandSectionLoader";
import { OverviewProCommandSkeleton } from "@/components/dashboard/OverviewProCommandSkeleton";
import { fetchDeskBrief } from "@/lib/desk/brief";
import {
  fetchLatestSnapshotUpdatedAt,
  fetchSnapshotUpdatedAtBySymbol,
} from "@/lib/market/quote-freshness";
import { OverviewContextRail } from "@/components/dashboard/OverviewContextRail";
import { OverviewLayoutBar } from "@/components/dashboard/OverviewLayoutBar";
import { OverviewLayoutBody } from "@/components/dashboard/OverviewLayoutBody";
import { OverviewPanelGate } from "@/components/dashboard/OverviewPanelGate";
import { loadWorkspaceActivitySnapshot } from "@/lib/workspace/activity-snapshot";
import type { SessionPayload } from "@/lib/auth/session-types";

type OwnCallRow = Awaited<ReturnType<typeof fetchUserRecentCalls>>[number];

const EMPTY_FEED_SUMMARY: FeedSummary = {
  count: 0,
  avgReturnPct: null,
  winners: 0,
  losers: 0,
  fueledCount: 0,
  longCount: 0,
  shortCount: 0,
  avgTargetProgress: null,
};

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

function proFlags(session: SessionPayload) {
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  return {
    proLocked,
    proGateCta: getProGateCta(proContext),
    isPro: !proLocked,
  };
}

const loadOverviewPrimaryData = cache(async function loadOverviewPrimaryData(
  session: SessionPayload
) {
  const [ownProfile, weeklyQuota, watchlistItems, activity] = await Promise.all([
    fetchOwnProfile(session),
    fetchWeeklyQuotaStatus(session.userId, session.membershipTier ?? null),
    fetchWatchlist(session.userId).catch(() => [] as Awaited<ReturnType<typeof fetchWatchlist>>),
    loadWorkspaceActivitySnapshot(session.userId),
  ]);

  const ownCalls = ownProfile.calls;
  const member = ownProfile.member;
  const ownCallCards = ownCalls.map((c) =>
    toOwnStripCard(
      c,
      session.username,
      session.displayName,
      session.userId,
      member?.avatar_url ?? null
    )
  );
  const openCallCards = ownCallCards.filter((c) => {
    const row = ownCalls.find((r) => r.id === c.id);
    return row ? isOpenMemberCall(row) : true;
  });
  const pendingEntryCount = openCallCards.filter(
    (c) => c.call_state === "pending_entry"
  ).length;

  const quotesUpdatedAt = await fetchLatestSnapshotUpdatedAt([
    ...openCallCards.map((c) => c.symbol),
    ...watchlistItems.map((w) => w.symbol),
  ]).catch(() => null);

  const quoteUpdatedAtBySymbol = await fetchSnapshotUpdatedAtBySymbol(
    openCallCards.map((c) => c.symbol)
  ).catch(() => ({}));

  return {
    ownProfile,
    ownCalls,
    member,
    weeklyQuota,
    watchlistItems,
    activity,
    ownCallCards,
    openCallCards,
    pendingEntryCount,
    quotesUpdatedAt,
    quoteUpdatedAtBySymbol,
  };
});

function OverviewPrimarySkeleton({ session }: { session: SessionPayload }) {
  const { isPro } = proFlags(session);
  const displayLabel = session.displayName ?? session.username;

  return (
    <>
      <WorkspaceCommandHeader
        displayName={displayLabel}
        username={session.username}
        openCallsCount={0}
        pendingEntryCount={0}
        isAdmin={session.role === "admin"}
        isPro={isPro}
      />
      <OverviewLayoutBar />
      <OverviewReturnHeroSkeleton />
    </>
  );
}

function OverviewFeedSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80" />
      <OverviewDeferredSkeleton />
    </div>
  );
}

async function OverviewContextRailSection({ session }: { session: SessionPayload }) {
  const { isPro } = proFlags(session);
  const {
    member,
    watchlistItems,
    activity,
    openCallCards,
    pendingEntryCount,
    quotesUpdatedAt,
  } = await loadOverviewPrimaryData(session);

  return (
    <OverviewContextRail
      openCallsCount={openCallCards.length}
      pendingEntryCount={pendingEntryCount}
      winRate={member?.win_rate}
      rankScore={member?.rank_score != null ? Number(member.rank_score) : null}
      communityPulse={EMPTY_FEED_SUMMARY}
      hotTickers={[]}
      watchlistPreview={watchlistItems.slice(0, 6)}
      isAdmin={session.role === "admin"}
      isPro={isPro}
      dmUnread={activity.dmUnread}
      notifUnread={activity.notifUnread}
      feedNewCount={activity.feedNewCount}
      quotesUpdatedAt={quotesUpdatedAt}
    />
  );
}

async function OverviewPrimarySection({ session }: { session: SessionPayload }) {
  const { isPro } = proFlags(session);
  const displayLabel = session.displayName ?? session.username;
  const {
    ownProfile,
    ownCalls,
    member,
    weeklyQuota,
    watchlistItems,
    activity,
    openCallCards,
    pendingEntryCount,
    quoteUpdatedAtBySymbol,
  } = await loadOverviewPrimaryData(session);

  const watchlistCount = watchlistItems.length;
  const journalThesisCount = watchlistItems.filter((i) => i.has_thesis).length;
  const callsCount = Math.max(ownCalls.length, member?.calls_count ?? 0);

  return (
    <>
      <WorkspaceCommandHeader
        displayName={displayLabel}
        username={session.username}
        openCallsCount={openCallCards.length}
        pendingEntryCount={pendingEntryCount}
        isAdmin={session.role === "admin"}
        isPro={isPro}
      />

      <OverviewLayoutBar />

      {activity.feedNewCount > 0 ? (
        <FeedNewBannerLive
          initialCount={activity.feedNewCount}
          mode="latest"
          feedFilter="all"
          searchQuery=""
          showNewOnly={false}
        />
      ) : null}

      <OverviewPanelGate panelId="hero">
        <OverviewReturnHeroSection
          ownCalls={ownCalls}
          profileHref={`/member/${session.username}`}
          winRate={member?.win_rate}
          rankScore={member?.rank_score != null ? Number(member.rank_score) : null}
          publishedCallCount={callsCount}
          member={ownProfile.member}
        />
      </OverviewPanelGate>

      <OverviewPanelGate panelId="stats">
        <WorkspaceOverviewStats
          username={session.username}
          winRate={member?.win_rate}
          rankScore={member?.rank_score != null ? Number(member.rank_score) : null}
          callsCount={member?.calls_count}
          quota={weeklyQuota}
          watchlistCount={watchlistCount}
          watchlistThesisCount={journalThesisCount}
        />
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
            proLocked={!isPro}
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
            callCount={callsCount}
            winRatePct={member?.win_rate ?? null}
            avgReturnPct={
              member?.avg_return_pct != null ? Number(member.avg_return_pct) : null
            }
          />
        ) : null}
      </OverviewPanelGate>
    </>
  );
}

async function OverviewProCommandSection({ session }: { session: SessionPayload }) {
  const { isPro } = proFlags(session);
  if (!isPro || session.subscriptionStatus !== "active") return null;

  const primary = await loadOverviewPrimaryData(session);
  const deskBrief = await fetchDeskBrief();
  const journalReadyItems = primary.watchlistItems.filter(
    (i) => i.journal_progress?.ready_to_publish
  );

  return (
    <OverviewPanelGate panelId="pro_command">
      <OverviewProCommandSectionLoader
        username={session.username}
        openCallCards={primary.openCallCards}
        ownCalls={primary.ownCalls}
        journalReadyItems={journalReadyItems}
        deskWeeklyNote={deskBrief.weeklyNote}
        watchlistItems={primary.watchlistItems}
      />
    </OverviewPanelGate>
  );
}

async function OverviewFeedSection({ session }: { session: SessionPayload }) {
  const { proLocked, proGateCta, isPro } = proFlags(session);
  const primary = await loadOverviewPrimaryData(session);
  const { ownCalls, openCallCards, watchlistItems } = primary;

  const [performingRaw, latestRaw, followingMembers, followingIdsList] = await Promise.all([
    loadFeedCalls("performing"),
    loadFeedCalls("latest"),
    fetchFollowingMembers(session.userId),
    fetchFollowingIds(session.userId),
  ]);
  const followingIds = new Set(followingIdsList);

  const symbolSet = [
    ...performingRaw.map((c) => c.symbol),
    ...latestRaw.map((c) => c.symbol),
    ...ownCalls.map((c) => c.symbol),
  ];
  const callIds = [...performingRaw.map((c) => c.id), ...latestRaw.map((c) => c.id)];

  const [hypeScores, discoveryCallIds] = await Promise.all([
    fetchHypeScoresBySymbols(symbolSet),
    fetchDiscoveryOriginCallIds(callIds),
  ]);

  const performingCalls = performingRaw.map((c) =>
    mapCallForCard(c, hypeScores, discoveryCallIds)
  );
  const latestCalls = latestRaw.map((c) => mapCallForCard(c, hypeScores, discoveryCallIds));
  const communityPulse = summarizeFeed(performingCalls);
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

  const previewQuoteSymbols = [
    ...new Set([
      ...latestPreviews.map((p) => p.symbol),
      ...followingPreviews.map((p) => p.symbol),
    ]),
  ];
  const quoteUpdatedAtBySymbol = await fetchSnapshotUpdatedAtBySymbol([
    ...openCallCards.map((c) => c.symbol),
    ...previewQuoteSymbols,
  ]).catch(() => ({}));

  return (
    <>
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
    </>
  );
}

/** Streams profile-first overview content, then community feed panels. */
export function OverviewPageLoader({ session }: { session: SessionPayload }) {
  return (
    <OverviewLayoutBody
      rail={
        <Suspense fallback={null}>
          <OverviewContextRailSection session={session} />
        </Suspense>
      }
    >
      <Suspense fallback={<OverviewPrimarySkeleton session={session} />}>
        <OverviewPrimarySection session={session} />
      </Suspense>
      <Suspense fallback={<OverviewProCommandSkeleton />}>
        <OverviewProCommandSection session={session} />
      </Suspense>
      <Suspense fallback={<OverviewFeedSkeleton />}>
        <OverviewFeedSection session={session} />
      </Suspense>
    </OverviewLayoutBody>
  );
}
