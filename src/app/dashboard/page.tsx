import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OverviewHero } from "@/components/dashboard/OverviewHero";
import { OverviewShortcutBar } from "@/components/dashboard/OverviewShortcutBar";
import { OverviewCommunityPulse } from "@/components/dashboard/OverviewCommunityPulse";
import { OverviewPerformanceChart } from "@/components/dashboard/OverviewPerformanceChart";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { FueledDeskPanel } from "@/components/dashboard/FueledDeskPanel";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { CallPreviewRow, type CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import {
  loadFeedCalls,
  loadMemberStats,
  mapCallForCard,
  requireDashboardSession,
} from "@/lib/dashboard/data";
import { buildFeedHref } from "@/lib/dashboard/nav";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { formatPct, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Overview",
};

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
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));
  const memberStats = await loadMemberStats(session.userId);

  const performingCalls = (await loadFeedCalls("performing")).map(mapCallForCard);
  const communityPulse = summarizeFeed(performingCalls);

  const { calls: ownCalls } = await fetchOwnProfile(session);
  const performanceSeries = buildCumulativeReturnSeries(ownCalls);

  const latestPreviews = (await loadFeedCalls("latest"))
    .filter((c) => !c.is_fueled)
    .slice(0, 5)
    .map((c) => toPreview(mapCallForCard(c)));

  const fueledPreviews = (await loadFeedCalls("latest"))
    .filter((c) => c.is_fueled)
    .slice(0, 3)
    .map((c) => toPreview(mapCallForCard(c)));

  let watchlistPreview: Awaited<ReturnType<typeof fetchWatchlist>> = [];
  try {
    watchlistPreview = (await fetchWatchlist(session.userId)).slice(0, 6);
  } catch {
    /* optional */
  }

  const displayLabel =
    session.displayName ??
    (session.role === "admin" ? "Administrator" : session.username);

  return (
    <div className="space-y-6">
      <OverviewHero
        displayName={displayLabel}
        username={session.username}
        winRate={memberStats?.win_rate}
        rankScore={memberStats?.rank_score != null ? Number(memberStats.rank_score) : null}
        callsCount={memberStats?.calls_count}
      />

      <OverviewShortcutBar />

      <OverviewCommunityPulse summary={communityPulse} proLocked={proLocked} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <WorkspacePanel
            title="Latest from members"
            subtitle="Newest community theses — open the feed for the full board"
            href={buildFeedHref({})}
            className="min-h-[320px]"
          >
            {latestPreviews.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--pf-gray-500)]">
                No member calls yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--pf-border)]">
                {latestPreviews.map((call) => (
                  <CallPreviewRow key={call.id} call={call} />
                ))}
              </div>
            )}
          </WorkspacePanel>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <OverviewPerformanceChart
            points={performanceSeries}
            profileHref={`/member/${session.username}`}
          />

          <WorkspacePanel
            title="Watchlist"
            subtitle="Symbols you’re tracking"
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

          <FueledDeskPanel calls={fueledPreviews} />
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
