import { DemoPreviewSourceSync } from "@/components/demo/DemoPreviewSourceSync";
import { DemoCapabilityGrid } from "@/components/demo/DemoCapabilityGrid";
import { DemoCommandHeader } from "@/components/demo/DemoCommandHeader";
import { DemoJoinFooter } from "@/components/demo/DemoJoinFooter";
import { DemoLockedSection } from "@/components/demo/DemoLockedSection";
import { DemoShortcutBar } from "@/components/demo/DemoShortcutBar";
import { OpenCallsPanel } from "@/components/dashboard/OpenCallsPanel";
import { OverviewReturnHero } from "@/components/dashboard/OverviewReturnHero";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { WorkspaceOverviewStats } from "@/components/dashboard/WorkspaceOverviewStats";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { ProCommandCenter } from "@/components/pro/ProCommandCenter";
import { Flame, LayoutGrid, Users } from "lucide-react";
import Link from "next/link";
import { getDemoPreviewTier } from "@/lib/demo/tier";
import { loadDemoOverviewData } from "@/lib/demo/preview-overview";
import { toChartMemberAvatar } from "@/lib/charts/member-avatar";
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
    proTodayBrief,
    proOverviewIntel,
    bookAnalytics,
  } = data;

  const watchlistCount = watchlistItems.length;
  const journalThesisCount = watchlistItems.filter((i) => i.has_thesis).length;
  const watchlistPreview = watchlistItems.slice(0, 6);

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

      <DemoCapabilityGrid tier={tier} />

      <OverviewReturnHero
        points={performanceSeries}
        profileHref={`/member/${profile.username}`}
        winRate={memberStats.win_rate}
        rankScore={memberStats.rank_score}
        publishedCallCount={memberStats.calls_count}
        memberAvatar={toChartMemberAvatar(profile)}
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
          <DemoLockedSection variant="feed" icon={LayoutGrid} />
          <DemoLockedSection variant="desk" icon={Flame} compact />
        </div>

        <div className="space-y-6 lg:col-span-5 xl:col-span-4">
          <DemoLockedSection variant="following" icon={Users} compact />

          <WorkspacePanel title="Watchlist" subtitle="Your research lane (sample)" href="/join">
            <ul>
              {watchlistPreview.map((w) => (
                <li key={w.symbol}>
                  <Link href={`/ticker/${w.symbol}`} className="pf-watchlist-mini">
                    <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
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
            <p className="border-t border-[var(--pf-border)] px-3 py-2.5 text-[10px] text-[var(--pf-gray-500)]">
              Journal notes & alerts sync here after join — no community calls in preview.
            </p>
          </WorkspacePanel>
        </div>
      </div>

      {proLocked ? (
        <ProMembershipStrip
          locked
          watchlistSymbols={watchlistItems.map((w) => w.symbol)}
          upgradeHref="/join"
        />
      ) : null}

      <DemoJoinFooter tier={tier} />
    </div>
  );
}
