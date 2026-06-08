import type { Metadata } from "next";
import { JournalCommandHeader } from "@/components/journal/JournalCommandHeader";
import { JournalContinueCard } from "@/components/journal/JournalContinueCard";
import { JournalIdeasPanel } from "@/components/journal/JournalIdeasPanel";
import { JournalReadyToPublishBanner } from "@/components/journal/JournalReadyToPublishBanner";
import { ResearchPipeline } from "@/components/journal/ResearchPipeline";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { WatchlistJournalReviewPanel } from "@/components/watchlist/WatchlistJournalReviewPanel";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";
import { pickJournalNextUp } from "@/lib/journal/next-up";
import { fetchJournalReview } from "@/lib/watchlist/journal-review";
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
  const initialFilter = sp.filter === "ready" ? ("ready" as const) : undefined;
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
  const pipelineCurrent = readyItems.length > 0 ? ("publish" as const) : ("research" as const);
  const publishHref =
    readyItems.length > 0 ? buildPublishUrlFromHubEntry(readyItems[0]!) : undefined;

  return (
    <div className="space-y-6">
      <JournalCommandHeader
        ideaCount={items.length}
        withThesis={withThesis}
        activeCount={active}
        nextUp={nextUp}
        proUnlocked={proUnlocked}
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

      <WorkspaceQuickActions proUnlocked={proUnlocked} />

      {journalReview ? <WatchlistJournalReviewPanel review={journalReview} /> : null}

      <JournalIdeasPanel
        demoMode={isDemoMode()}
        initialItems={items}
        initialFilter={initialFilter}
      />
    </div>
  );
}
