import Link from "next/link";
import { DemoPreviewSourceSync } from "@/components/demo/DemoPreviewSourceSync";
import { DemoCommandHeader } from "@/components/demo/DemoCommandHeader";
import { DemoShortcutBar } from "@/components/demo/DemoShortcutBar";
import { FeedPreviewList } from "@/components/dashboard/FeedPreviewList";
import { FollowingFeedPanel } from "@/components/dashboard/FollowingFeedPanel";
import { FueledDeskPreview } from "@/components/dashboard/FueledDeskPreview";
import { FueledTrackRecordPanel } from "@/components/dashboard/FueledTrackRecordPanel";
import { OpenCallsPanel } from "@/components/dashboard/OpenCallsPanel";
import { OverviewActivityPanels } from "@/components/dashboard/OverviewActivityPanels";
import { OverviewReturnHero } from "@/components/dashboard/OverviewReturnHero";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { WorkspaceLiveBar } from "@/components/dashboard/WorkspaceLiveBar";
import { WorkspaceOverviewStats } from "@/components/dashboard/WorkspaceOverviewStats";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { ProCommandCenter } from "@/components/pro/ProCommandCenter";
import { getDemoPreviewTier } from "@/lib/demo/tier";
import { loadDemoOverviewData } from "@/lib/demo/preview-overview";
import { formatPct, formatPrice } from "@/lib/utils";

export default async function DemoOverviewPage() {
  const tier = await getDemoPreviewTier();
  const data = await loadDemoOverviewData(tier);
  const {
    source,
    isPro,
    proLocked,
    profile,
    memberStats,
    quota,
    performanceSeries,
    openCallCards,
    pendingEntryCount,
    watchlistItems,
    followingMembers,
    followingPreviews,
    workspacePulse,
    hotTickers,
    latestPreviews,
    fueledPreviews,
    fueledTrackRecord,
    deskBrief,
    portfolio,
    proTodayBrief,
    proOverviewIntel,
    bookAnalytics,
  } = data;

  const watchlistCount = watchlistItems.length;
  const journalThesisCount = watchlistItems.filter((i) => i.has_thesis).length;
  const watchlistPreview = watchlistItems.slice(0, 6);
  const featuredDesk = fueledPreviews[0] ?? null;
  const fueledDeskCount = fueledPreviews.length;

  return (
    <div className="space-y-6">
      <DemoPreviewSourceSync source={source} />

      <DemoCommandHeader
        displayName={profile.displayName}
        openCallsCount={openCallCards.length}
        pendingEntryCount={pendingEntryCount}
        isPro={isPro}
      />

      <div className="lg:hidden">
        <DemoShortcutBar />
      </div>

      <OverviewReturnHero
        points={performanceSeries}
        profileHref={`/member/${profile.username}`}
        winRate={memberStats.win_rate}
        rankScore={memberStats.rank_score}
        publishedCallCount={memberStats.calls_count}
      />

      <WorkspaceOverviewStats
        username={profile.username}
        winRate={memberStats.win_rate}
        rankScore={memberStats.rank_score}
        callsCount={memberStats.calls_count}
        quota={quota}
        watchlistCount={watchlistCount}
        watchlistThesisCount={journalThesisCount}
        rankingsHref="/demo/rankings"
        watchlistHref="/join"
      />

      {openCallCards.length > 0 ? (
        <OpenCallsPanel
          calls={openCallCards}
          isAdmin={false}
          username={profile.username}
          isPro={isPro}
          proLocked={proLocked}
        />
      ) : null}

      <WorkspaceLiveBar
        initial={workspacePulse}
        compact
        previewMode
        feedHref="/demo/feed"
      />

      <OverviewActivityPanels hotTickers={hotTickers} feedHref="/demo/feed" />

      {isPro && proTodayBrief && proOverviewIntel ? (
        <ProCommandCenter
          brief={proTodayBrief}
          battleboard={proOverviewIntel.battleboard}
          screener={proOverviewIntel.screener}
          bookAnalytics={bookAnalytics}
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
                href="/demo/desk"
                className="text-xs font-semibold text-red-300 hover:text-red-200 hover:underline"
              >
                Open Fueled desk →
              </Link>
            </div>
            <FueledDeskPreview
              featured={featuredDesk}
              totalDeskCalls={fueledDeskCount}
              weeklyNote={deskBrief.weeklyNote}
            />
          </section>

          <WorkspacePanel title="Member feed" subtitle="Latest community theses" href="/demo/feed">
            {latestPreviews.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-[var(--pf-gray-500)]">
                No member calls to preview yet.
              </p>
            ) : (
              <FeedPreviewList previews={latestPreviews} />
            )}
          </WorkspacePanel>
        </div>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <FollowingFeedPanel
            following={followingMembers}
            previews={followingPreviews}
            feedHref="/demo/feed"
          />

          <WorkspacePanel
            title="Watchlist"
            subtitle="Symbols you follow"
            href="/join"
          >
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
                        ? "New call"
                        : w.last_price != null
                          ? `$${formatPrice(Number(w.last_price))}`
                          : formatPct(w.return_pct)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </WorkspacePanel>

          {portfolio.length > 0 ? (
            <WorkspacePanel
              title="Fueled portfolio"
              subtitle="Open house positions"
              href="/demo/desk"
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

      {proLocked ? (
        <ProMembershipStrip
          locked
          watchlistSymbols={watchlistItems.map((w) => w.symbol)}
          upgradeHref="/join"
        />
      ) : null}
    </div>
  );
}
