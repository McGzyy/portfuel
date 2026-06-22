import { Suspense, cache } from "react";
import { MemberOpenBookHeader } from "@/components/book/MemberOpenBookHeader";
import { WorkspaceLivePulse } from "@/components/dashboard/WorkspaceLivePulse";
import { MemberOpenBookPanel } from "@/components/book/MemberOpenBookPanel";
import { ShareTrackRecordCard } from "@/components/profile/ShareTrackRecordCard";
import { MemberBookAnalyticsSectionLoader } from "@/components/book/MemberBookAnalyticsSectionLoader";
import { MemberBookAnalyticsSkeleton } from "@/components/book/MemberBookAnalyticsSkeleton";
import { fetchMemberOpenBook } from "@/lib/calls/member-book";
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
import type { SessionPayload } from "@/lib/auth/session-types";
import { BookBodySkeleton, BookChromeSkeleton } from "@/components/book/BookPageLoadingSkeleton";

const loadBookPageCore = cache(async function loadBookPageCore(session: SessionPayload) {
  const [book, ownProfile] = await Promise.all([
    fetchMemberOpenBook(session.userId),
    fetchOwnProfile(session),
  ]);
  const trackRecord = summarizeMemberTrackRecord(ownProfile.calls);
  const proAnalytics = computeMemberProAnalytics(ownProfile.calls);
  const memberCalls = ownProfile.calls.filter((c) => !c.is_fueled);
  return { book, ownProfile, trackRecord, proAnalytics, memberCalls };
});

function proFlags(session: SessionPayload) {
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  return {
    proLocked,
    proGateCta: getProGateCta(proContext),
    isPro: !proLocked,
  };
}

function liveSymbolsFromBook(book: Awaited<ReturnType<typeof fetchMemberOpenBook>>) {
  return [
    ...book.openCalls.map((c) => c.symbol),
    ...book.needsClose.map((c) => c.symbol),
  ];
}

async function BookContextRailSection({ session }: { session: SessionPayload }) {
  const { book, proAnalytics } = await loadBookPageCore(session);
  return (
    <BookContextRail
      summary={book.summary}
      proAnalytics={proAnalytics}
      username={session.username}
    />
  );
}

async function BookChromeSection({ session }: { session: SessionPayload }) {
  const { isPro } = proFlags(session);
  const { book } = await loadBookPageCore(session);
  const symbols = liveSymbolsFromBook(book);
  const quotesUpdatedAt =
    symbols.length > 0 ? await fetchLatestSnapshotUpdatedAt(symbols) : null;

  return (
    <>
      <MemberOpenBookHeader
        summary={book.summary}
        username={session.username}
        isPro={isPro}
        quotesUpdatedAt={quotesUpdatedAt}
      />
      <WorkspaceLivePulse userId={session.userId} isPro={isPro} />
    </>
  );
}

async function BookBodySection({ session }: { session: SessionPayload }) {
  const { proLocked, proGateCta, isPro } = proFlags(session);
  const { book, ownProfile, trackRecord, proAnalytics } = await loadBookPageCore(session);
  const symbols = liveSymbolsFromBook(book);
  const quoteUpdatedAtBySymbol =
    symbols.length > 0
      ? await fetchSnapshotUpdatedAtBySymbol(symbols)
      : ({} as Record<string, string>);

  return (
    <>
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

      <MemberOpenBookPanel
        openCalls={book.openCalls}
        needsClose={book.needsClose}
        recentWrapped={book.recentWrapped}
        viewerUserId={session.userId}
        username={session.username}
        displayName={session.displayName}
        avatarUrl={ownProfile.member?.avatar_url ?? null}
        isAdmin={session.role === "admin"}
        isPro={isPro}
        proLocked={proLocked}
        quoteUpdatedAtBySymbol={quoteUpdatedAtBySymbol}
      />
    </>
  );
}

async function BookAnalyticsSection({ session }: { session: SessionPayload }) {
  const { proLocked, proGateCta } = proFlags(session);
  const { book, ownProfile, memberCalls } = await loadBookPageCore(session);

  return (
    <MemberBookAnalyticsSectionLoader
      memberCalls={memberCalls}
      book={book}
      member={ownProfile.member}
      username={session.username}
      profileHref={`/member/${session.username}`}
      proLocked={proLocked}
      proGateCta={proGateCta}
    />
  );
}

export function BookPageLoader({ session }: { session: SessionPayload }) {
  return (
    <WorkspaceContextShell
      pulseLabel="Book snapshot"
      rail={
        <Suspense fallback={null}>
          <BookContextRailSection session={session} />
        </Suspense>
      }
      mainClassName="space-y-6 pb-14 lg:pb-0"
    >
      <Suspense fallback={<BookChromeSkeleton />}>
        <BookChromeSection session={session} />
      </Suspense>
      <Suspense fallback={<MemberBookAnalyticsSkeleton />}>
        <BookAnalyticsSection session={session} />
      </Suspense>
      <Suspense fallback={<BookBodySkeleton />}>
        <BookBodySection session={session} />
      </Suspense>
    </WorkspaceContextShell>
  );
}
