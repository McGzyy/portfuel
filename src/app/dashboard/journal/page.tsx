import type { Metadata } from "next";
import { JournalCommandHeader } from "@/components/journal/JournalCommandHeader";
import { JournalContinueCard } from "@/components/journal/JournalContinueCard";
import { JournalIdeasPanel } from "@/components/journal/JournalIdeasPanel";
import { ResearchPipeline } from "@/components/journal/ResearchPipeline";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { WatchlistJournalReviewPanel } from "@/components/watchlist/WatchlistJournalReviewPanel";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";
import { pickJournalNextUp } from "@/lib/journal/next-up";
import { fetchJournalReview } from "@/lib/watchlist/journal-review";
import { fetchWatchlist } from "@/lib/watchlist/service";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Journal",
};

export default async function DashboardJournalPage() {
  const session = await requireDashboardSession();
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
  const logHref = nextUp
    ? nextUp.reason === "draft_thesis"
      ? nextUp.href
      : `${nextUp.href}#journal-entries`
    : undefined;

  return (
    <div className="space-y-6">
      <JournalCommandHeader
        ideaCount={items.length}
        withThesis={withThesis}
        activeCount={active}
        nextUp={nextUp}
      />

      <ResearchPipeline current="research" logHref={logHref} />

      {nextUp ? <JournalContinueCard nextUp={nextUp} /> : null}

      <WorkspaceQuickActions proUnlocked={proUnlocked} />

      {journalReview ? <WatchlistJournalReviewPanel review={journalReview} /> : null}

      <JournalIdeasPanel demoMode={isDemoMode()} initialItems={items} />
    </div>
  );
}
