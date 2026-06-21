import type { Metadata } from "next";
import { MemberOpenBookHeader } from "@/components/book/MemberOpenBookHeader";
import { MemberOpenBookPanel } from "@/components/book/MemberOpenBookPanel";
import { ShareTrackRecordCard } from "@/components/profile/ShareTrackRecordCard";
import { MemberBookAnalyticsSection } from "@/components/book/MemberBookAnalyticsSection";
import { fetchMemberOpenBook } from "@/lib/calls/member-book";
import { buildPerformanceSeries } from "@/lib/charts/cumulative-return-mtm";
import { buildBookAnalyticsSnapshot, emptyBookAnalyticsSnapshot, exposureFromBookSummary } from "@/lib/charts/book-analytics";
import { toChartMemberAvatar } from "@/lib/charts/member-avatar";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchOwnProfile } from "@/lib/users/own-profile";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { computeMemberProAnalytics } from "@/lib/users/member-analytics";
import { MemberProAnalyticsPanel } from "@/components/pro/MemberProAnalyticsPanel";
import { BookContextRail } from "@/components/book/BookContextRail";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
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
  const memberCalls = ownProfile.calls.filter((c) => !c.is_fueled);
  let performanceSeries: Awaited<ReturnType<typeof buildPerformanceSeries>> = [];
  try {
    performanceSeries =
      memberCalls.length > 0 ? await buildPerformanceSeries(memberCalls) : [];
  } catch (e) {
    console.error("[book/performance]", e);
  }

  let bookAnalytics = emptyBookAnalyticsSnapshot(performanceSeries);
  try {
    bookAnalytics = await buildBookAnalyticsSnapshot({
      performancePoints: performanceSeries,
      exposureSummary: book.summary.openCount > 0 ? book.summary : null,
      benchmarkCalls: book.openCalls.length > 0 ? book.openCalls : memberCalls,
      includeBenchmark: true,
    });
  } catch (e) {
    console.error("[book/analytics]", e);
    bookAnalytics = {
      ...emptyBookAnalyticsSnapshot(performanceSeries),
      exposure: exposureFromBookSummary(book.summary.openCount > 0 ? book.summary : null),
    };
  }
  const chartMemberAvatar = toChartMemberAvatar(ownProfile.member);

  return (
    <WorkspaceContextShell
      rail={
        <BookContextRail
          summary={book.summary}
          proAnalytics={proAnalytics}
          username={session.username}
        />
      }
      mainClassName="space-y-6 pb-14 lg:pb-0"
    >
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

      <MemberBookAnalyticsSection
        analytics={bookAnalytics}
        performancePoints={performanceSeries}
        memberAvatar={chartMemberAvatar}
        profileHref={`/member/${session.username}`}
        username={session.username}
        proLocked={proLocked}
        proGateCta={proGateCta}
      />

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
    </WorkspaceContextShell>
  );
}
