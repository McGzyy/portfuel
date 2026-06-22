import type { Metadata } from "next";
import { JournalCommandHeader } from "@/components/journal/JournalCommandHeader";
import { JournalContinueCard } from "@/components/journal/JournalContinueCard";
import { JournalIdeasPanel } from "@/components/journal/JournalIdeasPanel";
import { JournalReadyToPublishBanner } from "@/components/journal/JournalReadyToPublishBanner";
import { ResearchPipeline } from "@/components/journal/ResearchPipeline";
import { WatchlistJournalReviewPanel } from "@/components/watchlist/WatchlistJournalReviewPanel";
import { JournalContextRail } from "@/components/journal/JournalContextRail";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";
import { pickJournalNextUp } from "@/lib/journal/next-up";
import { fetchJournalReview } from "@/lib/watchlist/journal-review";
import { summarizeBookPosture } from "@/lib/watchlist/book-posture";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { buildPublishUrlFromHubEntry } from "@/lib/watchlist/journal-call-url";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Journal",
};

export default async function DashboardJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireDashboardSession();
  const sp = await searchParams;
  const initialFilter =
    sp.filter === "ready"
      ? ("ready" as const)
      : sp.filter === "in_book"
        ? ("in_book" as const)
        : undefined;
  const proUnlocked = canAccessProIntelligence(sessionToProContext(session));

  let items: Awaited<ReturnType<typeof fetchWatchlist>> = [];
  let journalReview: Awaited<ReturnType<typeof fetchJournalReview>> | null = null;
  try {
    [items, journalReview] = await Promise.all([
      fetchWatchlist(session.userId),
      fetchJournalReview(session.userId),
    ]);
  } catch (e) {
    console.error("[journal/page]", e);
  }

  const withThesis = items.filter((i) => i.has_thesis).length;
  const active = items.filter(
    (i) => i.outcome === "watching" || i.outcome === "developing" || !i.outcome
  ).length;
  const nextUp = pickJournalNextUp(items);
  const readyItems = items.filter((i) => i.journal_progress?.ready_to_publish);
  const readyCount = readyItems.length;
  const pipelineCurrent = readyItems.length > 0 ? ("publish" as const) : ("research" as const);
  const publishHref =
    readyItems.length > 0 ? buildPublishUrlFromHubEntry(readyItems[0]!) : undefined;
  const bookPosture = summarizeBookPosture(items);

  return (
    <WorkspaceContextShell
      pulseLabel="Journal pulse"
      rail={
        <JournalContextRail
          ideaCount={items.length}
          withThesis={withThesis}
          activeCount={active}
          readyCount={readyCount}
          nextUp={nextUp}
          items={items}
        />
      }
      mainClassName="space-y-6 pb-14 lg:pb-0"
    >
      <JournalCommandHeader
        ideaCount={items.length}
        withThesis={withThesis}
        activeCount={active}
        nextUp={nextUp}
        proUnlocked={proUnlocked}
        bookPosture={bookPosture}
      />

      {readyItems.length > 0 ? (
        <JournalReadyToPublishBanner
          readyItems={readyItems}
          viewAllHref="/dashboard/journal?filter=ready#journal-ideas"
        />
      ) : null}

      <ResearchPipeline
        current={pipelineCurrent}
        logHref={nextUp?.href}
        publishHref={publishHref}
      />

      {nextUp && readyItems.length === 0 ? <JournalContinueCard nextUp={nextUp} /> : null}

      {journalReview ? <WatchlistJournalReviewPanel review={journalReview} /> : null}

      <JournalIdeasPanel
        demoMode={isDemoMode()}
        initialItems={items}
        initialFilter={initialFilter}
      />
    </WorkspaceContextShell>
  );
}
