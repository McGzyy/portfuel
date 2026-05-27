import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OverviewActivityPanels } from "@/components/dashboard/OverviewActivityPanels";
import { DashboardQuickNav } from "@/components/dashboard/DashboardQuickNav";
import { OverviewHero } from "@/components/dashboard/OverviewHero";
import { OverviewShortcutBar } from "@/components/dashboard/OverviewShortcutBar";
import { MemberQuotaStrip } from "@/components/member/MemberQuotaStrip";
import { ProUpgradeBanner } from "@/components/pro/ProUpgradeBanner";
import { WorkspaceLiveBar } from "@/components/dashboard/WorkspaceLiveBar";
import { WorkspaceGuide } from "@/components/dashboard/WorkspaceGuide";
import { WorkspaceWalkthroughTips } from "@/components/dashboard/WorkspaceWalkthroughTips";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { isOpenMemberCall } from "@/lib/calls/open-calls";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { fetchWorkspacePulse } from "@/lib/workspace/pulse";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { fetchWeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { OverviewPerformanceChart } from "@/components/dashboard/OverviewPerformanceChart";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { FueledDeskHero } from "@/components/dashboard/FueledDeskHero";
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
import { buildFeedHref } from "@/lib/dashboard/nav";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { isProIntelligenceLocked, sessionToProContext } from "@/lib/features/pro-intelligence";
import { FollowingFeedPanel } from "@/components/dashboard/FollowingFeedPanel";
import { fetchFollowingIds, fetchFollowingMembers } from "@/lib/follows/service";
import { filterCallsByFollowing } from "@/lib/calls/filter-feed";
import { fetchDeskBrief } from "@/lib/desk/brief";
import { fetchDeskPortfolio } from "@/lib/desk/portfolio";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { formatPct, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Overview",
};

type OwnCallRow = Awaited<ReturnType<typeof fetchUserRecentCalls>>[number];

function toOwnStripCard(
  c: OwnCallRow,
  username: string,
  displayName: string | null
): CallCardData {
  return {
    id: c.id,
    symbol: c.symbol,
    asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
    direction: c.direction as "long" | "short",
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    is_fueled: Boolean(c.is_fueled),
    display_name: displayName,
    pin: username,
    username,
  };
}

function toPreview(
  c: ReturnType<typeof mapCallForCard>
): CallPreviewData {
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
  const memberStats = await loadMemberStats(session.userId);

  const performingRaw = await loadFeedCalls("performing");
  const latestRaw = await loadFeedCalls("latest");
  const ownProfile = await fetchOwnProfile(session);
  const ownCalls = ownProfile.calls;

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
  const weeklyQuota = await fetchWeeklyQuotaStatus(
    session.userId,
    session.membershipTier ?? null
  );

  const performanceSeries = buildCumulativeReturnSeries(ownCalls);

  const followingMembers = await fetchFollowingMembers(session.userId);
  const followingIds = new Set(await fetchFollowingIds(session.userId));
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

  let watchlistPreview: Awaited<ReturnType<typeof fetchWatchlist>> = [];
  try {
    watchlistPreview = (await fetchWatchlist(session.userId)).slice(0, 6);
  } catch {
    /* optional */
  }

  const deskBrief = await fetchDeskBrief();
  const portfolio = await fetchDeskPortfolio();

  let workspacePulse = null;
  try {
    workspacePulse = await fetchWorkspacePulse(session.userId);
  } catch {
    /* optional */
  }

  const ownCallCards = ownCalls.map((c) =>
    toOwnStripCard(c, session.username, session.displayName)
  );
  const openCallCards = ownCallCards.filter((c) => {
    const row = ownCalls.find((r) => r.id === c.id);
    return row ? isOpenMemberCall(row) : true;
  });

  const displayLabel =
    session.displayName ??
    (session.role === "admin" ? "Administrator" : session.username);

  const avgPulse = communityPulse.avgReturnPct;
  const avgAccent =
    avgPulse == null ? undefined : avgPulse >= 0 ? ("positive" as const) : ("negative" as const);

  return (
    <div className="space-y-8">
      <OverviewHero
        displayName={displayLabel}
        username={session.username}
        winRate={memberStats?.win_rate}
        rankScore={memberStats?.rank_score != null ? Number(memberStats.rank_score) : null}
        callsCount={memberStats?.calls_count}
        quotaUsed={weeklyQuota.used}
        quotaLimit={weeklyQuota.limit}
      />

      <WorkspaceLiveBar initial={workspacePulse} />

      <WorkspaceWalkthroughTips />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-3">
          <OverviewShortcutBar />
          <div className="lg:hidden">
            <DashboardQuickNav />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MemberQuotaStrip quota={weeklyQuota} showUpgrade={proLocked} />
          <WorkspaceGuide />
        </div>
      </div>

      {proLocked ? <ProUpgradeBanner /> : null}

      {communityPulse.count > 0 ? (
        <MetricsStrip
          eyebrow="Community · 30 days"
          items={[
            { label: "Active calls", value: String(communityPulse.count), hint: "Marked" },
            {
              label: "Avg return",
              value: formatPct(avgPulse),
              hint: "Community",
              accent: avgAccent,
            },
            {
              label: "Winners",
              value: String(communityPulse.winners),
              hint: `${communityPulse.losers} red`,
            },
          ]}
        />
      ) : null}

      <OverviewActivityPanels
        openCalls={openCallCards}
        username={session.username}
        hotTickers={hotTickers}
      />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
          <OverviewSection
            title="Fueled desk"
            subtitle="House research and model portfolio"
          >
            <FueledDeskHero
              featured={featuredDesk}
              totalDeskCalls={fueledCalls.length}
              weeklyNote={deskBrief.weeklyNote}
            />
          </OverviewSection>

          <OverviewSection
            title="Community"
            subtitle="What members are trading right now"
          >
            <div className="space-y-4">
              <WorkspacePanel
                title="Latest from members"
                subtitle="Newest theses — full board on the feed"
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
          </OverviewSection>
        </div>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <OverviewPerformanceChart
            points={performanceSeries}
            profileHref={`/member/${session.username}`}
          />

          <FollowingFeedPanel following={followingMembers} previews={followingPreviews} />

          <WorkspacePanel
            title="Watchlist"
            subtitle="Tap a symbol for chart & ticker intel"
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
                      <span className="font-mono font-bold text-[var(--pf-black)]">
                        {w.symbol}
                      </span>
                      <span className="text-xs tabular-nums text-[var(--pf-gray-500)]">
                        {w.last_price != null
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
              subtitle="House open theses"
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

      {session.role === "admin" ? (
        <p className="text-center text-xs text-[var(--pf-gray-400)]">
          <Link href="/admin?tab=analytics" className="font-semibold text-[var(--pf-red)] hover:underline">
            Admin analytics
          </Link>
        </p>
      ) : null}
    </div>
  );
}
