import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCommunityHint } from "@/components/dashboard/AdminCommunityHint";
import { WorkspaceOnboardingChecklist } from "@/components/dashboard/WorkspaceOnboardingChecklist";
import { WorkspaceChecklistCompleteBanner } from "@/components/dashboard/WorkspaceChecklistCompleteBanner";
import { OverviewActivityPanels } from "@/components/dashboard/OverviewActivityPanels";
import { COPY } from "@/lib/copy";
import { WorkspaceOverviewStats } from "@/components/dashboard/WorkspaceOverviewStats";
import { WorkspaceLiveBar } from "@/components/dashboard/WorkspaceLiveBar";
import { WorkspaceCommandHeader } from "@/components/dashboard/WorkspaceCommandHeader";
import { OpenCallsPanel } from "@/components/dashboard/OpenCallsPanel";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { fetchWorkspacePulse } from "@/lib/workspace/pulse";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { fetchWeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { OverviewReturnHero } from "@/components/dashboard/OverviewReturnHero";
import { ShareTrackRecordCard } from "@/components/profile/ShareTrackRecordCard";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { buildPerformanceSeries } from "@/lib/charts/cumulative-return-mtm";
import { toChartMemberAvatar } from "@/lib/charts/member-avatar";
import { FueledDeskPreview } from "@/components/dashboard/FueledDeskPreview";
import { FueledTrackRecordPanel } from "@/components/dashboard/FueledTrackRecordPanel";
import { fetchFueledTrackRecord } from "@/lib/fueled/track-record";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { FeedPreviewList } from "@/components/dashboard/FeedPreviewList";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import type { CallCardData } from "@/components/calls/CallCard";
import type { fetchUserRecentCalls } from "@/lib/users/profile";
import {
  loadFeedCalls,
  loadMemberStats,
  mapCallForCard,
  requireDashboardSession,
} from "@/lib/dashboard/data";
import { mapUserCallRowToCard } from "@/lib/calls/map-user-call-card";
import { computeMemberProAnalytics } from "@/lib/users/member-analytics";
import { buildFeedHref } from "@/lib/dashboard/nav";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { FollowingFeedPanel } from "@/components/dashboard/FollowingFeedPanel";
import { fetchFollowingIds, fetchFollowingMembers } from "@/lib/follows/service";
import { filterCallsByFollowing } from "@/lib/calls/filter-feed";
import { fetchDeskBrief } from "@/lib/desk/brief";
import { fetchDeskPortfolio } from "@/lib/desk/portfolio";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { fetchEmailPrefs } from "@/lib/email/preferences";
import { AlertsEmailSetupStrip } from "@/components/dashboard/AlertsEmailSetupStrip";
import { fetchJournalHighlights } from "@/lib/watchlist/journal-highlights";
import { WatchlistJournalPulse } from "@/components/watchlist/WatchlistJournalPulse";
import { JournalReadyToPublishBanner } from "@/components/journal/JournalReadyToPublishBanner";
import { JournalContinueCard } from "@/components/journal/JournalContinueCard";
import { BookPostureStrip } from "@/components/watchlist/BookPostureStrip";
import { pickJournalNextUp } from "@/lib/journal/next-up";
import { ProCommandCenter } from "@/components/pro/ProCommandCenter";
import { fetchCommunityScreener } from "@/lib/screener/community";
import type { CommunityScreenerData } from "@/lib/screener/community";
import {
  fetchEarningsBattleboard,
  summarizeBattleboard,
  type EarningsBattleboardSummary,
} from "@/lib/earnings/battleboard";
import { fetchEarningsForSymbols } from "@/lib/market/earnings-calendar";
import {
  buildProTodayBrief,
} from "@/lib/pro/today-brief";
import { formatPct, formatPrice } from "@/lib/utils";
import { fetchReferralStats } from "@/lib/referrals/service";
import {
  shouldShowReferralOverviewPrompt,
  toReferralInvitePrompt,
} from "@/lib/referrals/prompt";
import { ReferralOverviewStrip } from "@/components/referrals/ReferralInviteStrip";
import { OverviewShortcutBar } from "@/components/dashboard/OverviewShortcutBar";

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

  const [
    memberStats,
    performingRaw,
    latestRaw,
    ownProfile,
    weeklyQuota,
    followingMembers,
    followingIdsList,
  ] = await Promise.all([
    loadMemberStats(session.userId),
    loadFeedCalls("performing"),
    loadFeedCalls("latest"),
    fetchOwnProfile(session),
    fetchWeeklyQuotaStatus(session.userId, session.membershipTier ?? null),
    fetchFollowingMembers(session.userId),
    fetchFollowingIds(session.userId),
  ]);
  const ownCalls = ownProfile.calls;
  const followingIds = new Set(followingIdsList);

  const hypeScores = await fetchHypeScoresBySymbols([
    ...performingRaw.map((c) => c.symbol),
    ...latestRaw.map((c) => c.symbol),
    ...ownCalls.map((c) => c.symbol),
  ]);
  const performingCalls = performingRaw.map((c) => mapCallForCard(c, hypeScores));
  const latestCalls = latestRaw.map((c) => mapCallForCard(c, hypeScores));
  const communityPulse = summarizeFeed(performingCalls);
  const hotTickers = getHotTickersFromCalls(
    latestCalls.map((c) => ({ symbol: c.symbol, return_pct: c.return_pct })),
    8
  );

  const performanceSeries = await buildPerformanceSeries(ownCalls);
  const chartMemberAvatar = toChartMemberAvatar(ownProfile.member);
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
  const proBookAnalytics = isPro ? computeMemberProAnalytics(ownCalls) : null;

  const [
    watchlistItems,
    emailPrefs,
    deskBrief,
    portfolio,
    fueledTrackRecord,
    journalIdeas,
    workspacePulse,
    referralStats,
  ] = await Promise.all([
    fetchWatchlist(session.userId).catch(() => [] as Awaited<ReturnType<typeof fetchWatchlist>>),
    fetchEmailPrefs(session.userId).catch(() => null),
    fetchDeskBrief(),
    fetchDeskPortfolio(),
    fetchFueledTrackRecord(),
    fetchJournalHighlights(session.userId).catch(
      () => [] as Awaited<ReturnType<typeof fetchJournalHighlights>>
    ),
    fetchWorkspacePulse(session.userId, isPro).catch(() => null),
    fetchReferralStats(session.userId, session.username).catch(() => null),
  ]);

  const watchlistCount = watchlistItems.length;
  const journalThesisCount = watchlistItems.filter((i) => i.has_thesis).length;
  const watchlistPreview = watchlistItems.slice(0, 6);

  let referralPrompt = null;
  if (referralStats) {
    const prompt = toReferralInvitePrompt(referralStats);
    if (shouldShowReferralOverviewPrompt(prompt, { publishedCall: ownCalls.length > 0 })) {
      referralPrompt = prompt;
    }
  }

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

  const journalReadyItems = watchlistItems.filter((i) => i.journal_progress?.ready_to_publish);
  const journalNextUp = pickJournalNextUp(watchlistItems);

  let proTodayBrief: ReturnType<typeof buildProTodayBrief> | null = null;
  let proOverviewIntel: {
    battleboard: EarningsBattleboardSummary;
    screener: CommunityScreenerData;
    reportingSymbols: string[];
  } | null = null;

  if (session.subscriptionStatus === "active") {
    const [screener, battleboardRows, watchlistEarnings] = await Promise.all([
      fetchCommunityScreener(),
      fetchEarningsBattleboard(),
      isPro
        ? fetchEarningsForSymbols(
            watchlistItems.filter((w) => w.asset_class === "equity").map((w) => w.symbol),
            14
          )
        : Promise.resolve([]),
    ]);
    const battleboard = summarizeBattleboard(battleboardRows);
    proOverviewIntel = {
      battleboard,
      screener,
      reportingSymbols: battleboardRows.map((row) => row.symbol),
    };

    proTodayBrief = buildProTodayBrief({
      deskNote: deskBrief.weeklyNote,
      watchlistEarnings,
      screener,
      battleboard,
      openCalls: openCallCards,
      journalReady: journalReadyItems,
      memberProfileHref: `/member/${session.username}`,
    });
  }

  return (
    <div className="space-y-6">
      <WorkspaceCommandHeader
        displayName={displayLabel}
        username={session.username}
        openCallsCount={openCallCards.length}
        pendingEntryCount={pendingEntryCount}
        isAdmin={session.role === "admin"}
        isPro={isPro}
      />

      <div className="lg:hidden">
        <OverviewShortcutBar />
      </div>

      <OverviewReturnHero
        points={performanceSeries}
        profileHref={`/member/${session.username}`}
        winRate={memberStats?.win_rate}
        rankScore={memberStats?.rank_score != null ? Number(memberStats.rank_score) : null}
        publishedCallCount={Math.max(ownCalls.length, memberStats?.calls_count ?? 0)}
        memberAvatar={chartMemberAvatar}
      />

      <WorkspaceOverviewStats
        username={session.username}
        winRate={memberStats?.win_rate}
        rankScore={memberStats?.rank_score != null ? Number(memberStats.rank_score) : null}
        callsCount={memberStats?.calls_count}
        quota={weeklyQuota}
        watchlistCount={watchlistCount}
        watchlistThesisCount={journalThesisCount}
      />

      <OverviewActivityPanels hotTickers={hotTickers} />

      {openCallCards.length > 0 ? (
        <OpenCallsPanel
          calls={openCallCards}
          viewerUserId={session.userId}
          isAdmin={session.role === "admin"}
          username={session.username}
          isPro={isPro}
          proLocked={proLocked}
        />
      ) : null}

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

      {workspacePulse ? <WorkspaceLiveBar initial={workspacePulse} compact /> : null}

      {journalReadyItems.length > 0 ? (
        <JournalReadyToPublishBanner
          readyItems={journalReadyItems}
          viewAllHref="/dashboard/journal?filter=ready#journal-ideas"
        />
      ) : journalNextUp ? (
        <JournalContinueCard nextUp={journalNextUp} />
      ) : null}

      {watchlistCount > 0 ? <BookPostureStrip items={watchlistItems} /> : null}

      {isPro && proTodayBrief && proOverviewIntel ? (
        <ProCommandCenter
          brief={proTodayBrief}
          battleboard={proOverviewIntel.battleboard}
          screener={proOverviewIntel.screener}
          bookAnalytics={proBookAnalytics}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <section className="pf-fueled-desk p-5 sm:p-6" aria-label="PortFuel Fueled desk">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="pf-eyebrow">PortFuel Fueled</p>
                <h2 className="mt-1 text-lg font-bold tracking-tight">Fueled desk</h2>
                <p className="mt-1 max-w-xl text-sm text-slate-400">
                  House research and model portfolio
                </p>
              </div>
              <Link
                href="/dashboard/desk"
                className="text-xs font-semibold text-red-300 hover:text-red-200 hover:underline"
              >
                Open Fueled desk →
              </Link>
            </div>
            <FueledDeskPreview
              featured={featuredDesk}
              totalDeskCalls={fueledCalls.length}
              weeklyNote={deskBrief.weeklyNote}
            />
          </section>

          <WorkspacePanel
            title="Member feed"
            subtitle="Latest community theses"
            href={buildFeedHref({})}
          >
            {latestPreviews.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--pf-gray-500)]">
                No member calls yet.
              </p>
            ) : (
              <FeedPreviewList previews={latestPreviews} />
            )}
          </WorkspacePanel>
        </div>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <FollowingFeedPanel following={followingMembers} previews={followingPreviews} />

          <WorkspacePanel
            title="Watchlist"
            subtitle="Symbols you follow"
            href="/dashboard/watchlist"
          >
            {watchlistPreview.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[var(--pf-gray-500)]">
                Add symbols on the watchlist page.
              </p>
            ) : (
              <ul>
                {watchlistPreview.map((w) => (
                  <li key={w.symbol}>
                    <Link href={`/ticker/${w.symbol}`} className="pf-watchlist-mini">
                      <span className="flex items-center gap-1.5 font-mono font-bold text-[var(--pf-black)]">
                        {w.symbol}
                        {w.has_unread_call_alert ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-[var(--pf-red)]"
                            title="New community call"
                          />
                        ) : null}
                      </span>
                      <span className="text-xs tabular-nums text-[var(--pf-gray-500)]">
                        {w.has_unread_call_alert
                          ? COPY.watchlistNewCall
                          : w.last_price != null
                            ? `$${formatPrice(Number(w.last_price))}`
                            : formatPct(w.return_pct)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </WorkspacePanel>

          {portfolio.length > 0 ? (
            <WorkspacePanel
              title="Fueled portfolio"
              subtitle="Open house positions"
              href="/dashboard/desk"
            >
              <div className="divide-y divide-[var(--pf-border)]">
                {portfolio
                  .filter((e) => e.status === "open")
                  .slice(0, 4)
                  .map((e) => (
                    <Link
                      key={e.id}
                      href={`/ticker/${e.symbol}`}
                      className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-[var(--pf-gray-50)]"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
                          {e.symbol}
                        </span>
                        <p className="text-xs text-[var(--pf-gray-500)]">
                          {e.direction} · {e.conviction}/5
                        </p>
                      </div>
                      <span
                        className={
                          e.return_pct == null
                            ? "text-xs font-bold tabular-nums text-[var(--pf-gray-500)]"
                            : e.return_pct >= 0
                              ? "text-xs font-bold tabular-nums text-emerald-600"
                              : "text-xs font-bold tabular-nums text-rose-600"
                        }
                      >
                        {formatPct(e.return_pct)}
                      </span>
                    </Link>
                  ))}
              </div>
            </WorkspacePanel>
          ) : null}
        </div>
      </div>

      <FueledTrackRecordPanel record={fueledTrackRecord} />

      {journalIdeas.length > 0 ? <WatchlistJournalPulse ideas={journalIdeas} /> : null}

      <AlertsEmailSetupStrip
        watchlistCount={watchlistCount}
        emailInstantEnabled={emailPrefs?.emailInstantEnabled ?? false}
        notifyEmail={emailPrefs?.notifyEmail ?? null}
        emailVerified={session.emailVerified}
      />

      {session.role !== "admin" ? (
        <>
          <WorkspaceOnboardingChecklist
            publishedCall={ownCalls.length > 0}
            watchlistCount={watchlistCount}
            journalThesisCount={journalThesisCount}
            followingCount={followingMembers.length}
          />
          <WorkspaceChecklistCompleteBanner
            publishedCall={ownCalls.length > 0}
            watchlistCount={watchlistCount}
            journalThesisCount={journalThesisCount}
            followingCount={followingMembers.length}
            referralPrompt={referralPrompt}
          />
        </>
      ) : null}

      {referralPrompt ? <ReferralOverviewStrip prompt={referralPrompt} /> : null}

      {proLocked ? (
        <ProMembershipStrip
          locked
          watchlistSymbols={watchlistItems.map((w) => w.symbol)}
        />
      ) : null}

      {session.role === "admin" && communityPulse.count === 0 && latestPreviews.length === 0 ? (
        <AdminCommunityHint />
      ) : null}

      {session.role === "admin" ? (
        <p className="text-center text-xs text-[var(--pf-gray-400)]">
          <Link
            href="/admin?tab=analytics"
            className="font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            Admin analytics
          </Link>
        </p>
      ) : null}
    </div>
  );
}
