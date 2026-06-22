import type { Metadata } from "next";
import { Suspense } from "react";
import { MemberOpenBookHeader } from "@/components/book/MemberOpenBookHeader";
import { WorkspaceLivePulse } from "@/components/dashboard/WorkspaceLivePulse";
import { MemberOpenBookPanel } from "@/components/book/MemberOpenBookPanel";
import { ShareTrackRecordCard } from "@/components/profile/ShareTrackRecordCard";
import { MemberBookAnalyticsSectionLoader } from "@/components/book/MemberBookAnalyticsSectionLoader";
import { MemberBookAnalyticsSkeleton } from "@/components/book/MemberBookAnalyticsSkeleton";
import { fetchMemberOpenBook } from "@/lib/calls/member-book";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchLatestSnapshotUpdatedAt, fetchSnapshotUpdatedAtBySymbol } from "@/lib/market/quote-freshness";
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
  const liveSymbols = [
    ...book.openCalls.map((c) => c.symbol),
    ...book.needsClose.map((c) => c.symbol),
  ];
  const [quotesUpdatedAt, quoteUpdatedAtBySymbol] = await Promise.all([
    liveSymbols.length > 0 ? fetchLatestSnapshotUpdatedAt(liveSymbols) : Promise.resolve(null),
    liveSymbols.length > 0
      ? fetchSnapshotUpdatedAtBySymbol(liveSymbols)
      : Promise.resolve({} as Record<string, string>),
  ]);

  return (
    <WorkspaceContextShell
      pulseLabel="Book snapshot"
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
        quotesUpdatedAt={quotesUpdatedAt}
      />
      <WorkspaceLivePulse userId={session.userId} isPro={!proLocked} />
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

      <Suspense fallback={<MemberBookAnalyticsSkeleton />}>
        <MemberBookAnalyticsSectionLoader
          memberCalls={memberCalls}
          book={book}
          member={ownProfile.member}
          username={session.username}
          profileHref={`/member/${session.username}`}
          proLocked={proLocked}
          proGateCta={proGateCta}
        />
      </Suspense>

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
        quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
      />
    </WorkspaceContextShell>
  );
}
