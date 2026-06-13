import type { Metadata } from "next";
import { MemberOpenBookHeader } from "@/components/book/MemberOpenBookHeader";
import { MemberOpenBookPanel } from "@/components/book/MemberOpenBookPanel";
import { MemberOpenBookSymbols } from "@/components/book/MemberOpenBookSymbols";
import { ShareTrackRecordCard } from "@/components/profile/ShareTrackRecordCard";
import { OverviewPerformanceChart } from "@/components/dashboard/OverviewPerformanceChart";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { ProQuoteRefreshMount } from "@/components/market/ProQuoteRefreshMount";
import { fetchMemberOpenBook } from "@/lib/calls/member-book";
import { buildCumulativeReturnSeries } from "@/lib/charts/cumulative-return";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Your open book",
};

export default async function DashboardBookPage() {
  const session = await requireDashboardSession();
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));
  const [book, ownProfile] = await Promise.all([
    fetchMemberOpenBook(session.userId),
    fetchOwnProfile(session),
  ]);
  const trackRecord = summarizeMemberTrackRecord(ownProfile.calls);
  const performanceSeries = buildCumulativeReturnSeries(book.openCalls);

  return (
    <div className="space-y-6">
      {!proLocked ? <ProQuoteRefreshMount enabled /> : null}
      <MemberOpenBookHeader
        summary={book.summary}
        username={session.username}
        isPro={!proLocked}
      />
      <WorkspaceQuickActions proUnlocked={!proLocked} />

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

      {book.summary.openCount > 0 ? (
        <>
          <OverviewPerformanceChart
            points={performanceSeries}
            profileHref={`/member/${session.username}`}
          />
          <MemberOpenBookSymbols rows={book.summary.bySymbol} />
        </>
      ) : null}

      <MemberOpenBookPanel
        openCalls={book.openCalls}
        recentClosed={book.recentClosed}
        viewerUserId={session.userId}
        username={session.username}
        displayName={session.displayName}
        isAdmin={session.role === "admin"}
        isPro={!proLocked}
        proLocked={proLocked}
      />
    </div>
  );
}
