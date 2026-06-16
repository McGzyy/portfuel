import type { Metadata } from "next";
import { MemberOpenBookHeader } from "@/components/book/MemberOpenBookHeader";
import { MemberOpenBookPanel } from "@/components/book/MemberOpenBookPanel";
import { MemberOpenBookSymbols } from "@/components/book/MemberOpenBookSymbols";
import { ShareTrackRecordCard } from "@/components/profile/ShareTrackRecordCard";
import { OverviewPerformanceChart } from "@/components/dashboard/OverviewPerformanceChart";
import { ProQuoteRefreshMount } from "@/components/market/ProQuoteRefreshMount";
import { fetchMemberOpenBook } from "@/lib/calls/member-book";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { toChartMemberAvatar } from "@/lib/charts/member-avatar";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { computeMemberProAnalytics } from "@/lib/users/member-analytics";
import { MemberProAnalyticsPanel } from "@/components/pro/MemberProAnalyticsPanel";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Your positions",
};

export default async function DashboardBookPage() {
  const session = await requireDashboardSession();
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));
  const [book, ownProfile] = await Promise.all([
    fetchMemberOpenBook(session.userId),
    fetchOwnProfile(session),
  ]);
  const trackRecord = summarizeMemberTrackRecord(ownProfile.calls);
  const proAnalytics = computeMemberProAnalytics(ownProfile.calls);
  const proGateCta = getProGateCta(sessionToProContext(session));
  const performanceSeries = buildCumulativeReturnSeries(book.openCalls);
  const chartMemberAvatar = toChartMemberAvatar(ownProfile.member);

  return (
    <div className="space-y-6">
      {!proLocked ? <ProQuoteRefreshMount enabled /> : null}
      <MemberOpenBookHeader
        summary={book.summary}
        username={session.username}
        isPro={!proLocked}
      />
      <ShareTrackRecordCard
        username={session.username}
        callCount={trackRecord.callCount}
        winRatePct={
          trackRecord.callCount > 0
            ? Math.round((trackRecord.winners / trackRecord.callCount) * 100)
            : null
        }
        avgReturnPct={trackRecord.avgReturnPct}
      />

      <MemberProAnalyticsPanel
        analytics={proAnalytics}
        locked={proLocked}
        proGateCta={proGateCta}
      />

      {book.summary.openCount > 0 ? (
        <>
          <OverviewPerformanceChart
            points={performanceSeries}
            profileHref={`/member/${session.username}`}
            memberAvatar={chartMemberAvatar}
          />
          <MemberOpenBookSymbols rows={book.summary.bySymbol} />
        </>
      ) : null}

      <MemberOpenBookPanel
        openCalls={book.openCalls}
        needsClose={book.needsClose}
        recentWrapped={book.recentWrapped}
        viewerUserId={session.userId}
        username={session.username}
        displayName={session.displayName}
        avatarUrl={ownProfile.member?.avatar_url ?? null}
        isAdmin={session.role === "admin"}
        isPro={!proLocked}
        proLocked={proLocked}
      />
    </div>
  );
}
