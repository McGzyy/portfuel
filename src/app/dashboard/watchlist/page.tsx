import type { Metadata } from "next";
import { WatchlistCommandHeader } from "@/components/dashboard/WatchlistCommandHeader";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { TickerLookupBar } from "@/components/dashboard/TickerLookupBar";
import { WatchlistIntelHint } from "@/components/dashboard/WatchlistIntelHint";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { WatchlistQuickAddChips } from "@/components/dashboard/WatchlistQuickAddChips";
import { FeedRefreshButton } from "@/components/dashboard/FeedRefreshButton";
import { EarningsCalendarPanel } from "@/components/pro/EarningsCalendarPanel";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";
import { fetchWatchlist } from "@/lib/watchlist/service";
import { fetchJournalReview } from "@/lib/watchlist/journal-review";
import { WatchlistJournalReviewPanel } from "@/components/watchlist/WatchlistJournalReviewPanel";
import {
  canAccessProIntelligence,
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default async function DashboardWatchlistPage() {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);
  const proUnlocked = canAccessProIntelligence(proContext);

  let items: Awaited<ReturnType<typeof fetchWatchlist>> = [];
  let journalReview: Awaited<ReturnType<typeof fetchJournalReview>> | null = null;
  try {
    [items, journalReview] = await Promise.all([
      fetchWatchlist(session.userId),
      fetchJournalReview(session.userId),
    ]);
  } catch (e) {
    console.error("[watchlist/page]", e);
  }

  const unreadAlerts = items.filter((i) => i.has_unread_call_alert).length;
  const callsLast7d = items.reduce((sum, i) => sum + (i.community_calls_7d ?? 0), 0);

  return (
    <div className="space-y-6">
      <WatchlistCommandHeader
        symbolCount={items.length}
        unreadAlerts={unreadAlerts}
        callsLast7d={callsLast7d}
      />

      <WorkspaceQuickActions proUnlocked={proUnlocked} />

      {proLocked ? <ProMembershipStrip locked /> : null}

      <div className="pf-workspace-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--pf-gray-500)]">
            Lookup any symbol for chart, calls, and intel — not limited to your list.
          </p>
          <FeedRefreshButton />
        </div>
        <div className="mt-4">
          <TickerLookupBar embedded />
        </div>
        {items.length < 6 ? (
          <div className="mt-4 border-t border-[var(--pf-border)] pt-4">
            <WatchlistQuickAddChips
              existingSymbols={items.map((i) => i.symbol)}
              demoMode={isDemoMode()}
            />
          </div>
        ) : null}
      </div>

      <WatchlistIntelHint />

      {journalReview ? <WatchlistJournalReviewPanel review={journalReview} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <WatchlistPanel demoMode={isDemoMode()} proUnlocked={proUnlocked} />
        <EarningsCalendarPanel locked={proLocked} proGateCta={proGateCta} />
      </div>
    </div>
  );
}
