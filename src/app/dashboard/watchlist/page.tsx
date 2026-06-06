import type { Metadata } from "next";
import { WatchlistCommandHeader } from "@/components/dashboard/WatchlistCommandHeader";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { TickerLookupBar } from "@/components/dashboard/TickerLookupBar";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { WatchlistQuickAddChips } from "@/components/dashboard/WatchlistQuickAddChips";
import { FeedRefreshButton } from "@/components/dashboard/FeedRefreshButton";
import { EarningsCalendarPanel } from "@/components/pro/EarningsCalendarPanel";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { ResearchPipeline } from "@/components/journal/ResearchPipeline";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";
import { pickJournalNextUp } from "@/lib/journal/next-up";
import { fetchWatchlist } from "@/lib/watchlist/service";
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
  try {
    items = await fetchWatchlist(session.userId);
  } catch (e) {
    console.error("[watchlist/page]", e);
  }

  const unreadAlerts = items.filter((i) => i.has_unread_call_alert).length;
  const callsLast7d = items.reduce((sum, i) => sum + (i.community_calls_7d ?? 0), 0);
  const nextUp = pickJournalNextUp(items);
  const logHref = nextUp
    ? nextUp.reason === "draft_thesis"
      ? nextUp.href
      : `${nextUp.href}#journal-entries`
    : undefined;

  return (
    <div className="space-y-6">
      <WatchlistCommandHeader
        symbolCount={items.length}
        unreadAlerts={unreadAlerts}
        callsLast7d={callsLast7d}
        nextUp={nextUp}
      />

      <ResearchPipeline current="track" logHref={logHref} />

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

      <div className="grid gap-6 lg:grid-cols-2">
        <WatchlistPanel demoMode={isDemoMode()} proUnlocked={proUnlocked} initialItems={items} />
        <EarningsCalendarPanel locked={proLocked} proGateCta={proGateCta} />
      </div>
    </div>
  );
}
