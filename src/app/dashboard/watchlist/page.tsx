import type { Metadata } from "next";
import { WatchlistCommandHeader } from "@/components/dashboard/WatchlistCommandHeader";
import { TrackWorkflowGuide } from "@/components/dashboard/TrackWorkflowGuide";
import { TickerLookupBar } from "@/components/dashboard/TickerLookupBar";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { WatchlistItemsProvider } from "@/components/dashboard/WatchlistItemsProvider";
import { WatchlistQuickAddChips } from "@/components/dashboard/WatchlistQuickAddChips";
import { FeedRefreshButton } from "@/components/dashboard/FeedRefreshButton";
import { EarningsCalendarPanel } from "@/components/pro/EarningsCalendarPanel";
import { MarketHeadlinesWidget } from "@/components/pro/MarketHeadlinesWidget";
import { WatchlistAiDigestPanel } from "@/components/pro/WatchlistAiDigestPanel";
import { ResearchPipeline } from "@/components/journal/ResearchPipeline";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";
import { pickJournalNextUp } from "@/lib/journal/next-up";
import { enrichWatchlistIntelSnippets } from "@/lib/watchlist/intel-snippets";
import { summarizeBookPosture } from "@/lib/watchlist/book-posture";
import { fetchWatchlist } from "@/lib/watchlist/service";
import {
  DEFAULT_WATCHLIST_ALERT_PREFS,
  fetchUserAlertPrefs,
} from "@/lib/alerts/preferences";
import {
  canAccessProIntelligence,
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Watchlist",
};

export const dynamic = "force-dynamic";

export default async function DashboardWatchlistPage() {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);
  const proUnlocked = canAccessProIntelligence(proContext);

  let items: Awaited<ReturnType<typeof fetchWatchlist>> = [];
  let alertPrefs = DEFAULT_WATCHLIST_ALERT_PREFS;
  try {
    items = await fetchWatchlist(session.userId);
    if (proUnlocked && items.length > 0) {
      items = await enrichWatchlistIntelSnippets(items);
    }
    const prefs = await fetchUserAlertPrefs(session.userId);
    if (prefs?.watchlist) alertPrefs = prefs.watchlist;
  } catch (e) {
    console.error("[watchlist/page]", e);
  }

  const unreadAlerts = items.filter((i) => i.has_unread_call_alert).length;
  const callsLast7d = items.reduce((sum, i) => sum + (i.community_calls_7d ?? 0), 0);
  const nextUp = pickJournalNextUp(items);
  const bookPosture = summarizeBookPosture(items);

  return (
    <WatchlistItemsProvider initialItems={items}>
      <div className="space-y-6">
        <WatchlistCommandHeader
          symbolCount={items.length}
          unreadAlerts={unreadAlerts}
          callsLast7d={callsLast7d}
          nextUp={nextUp}
          bookPosture={bookPosture}
        />

        <ResearchPipeline current="track" logHref={nextUp?.href} />

        <TrackWorkflowGuide />

        <WatchlistAiDigestPanel
          locked={proLocked}
          proGateCta={proGateCta}
          symbolCount={items.length}
        />

        <div className="pf-workspace-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Symbol lookup
              </p>
              <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
                Browse chart, community calls, and intel for any ticker —{" "}
                <span className="font-semibold text-[var(--pf-black)]">does not add</span> to your
                watchlist.
              </p>
            </div>
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

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <WatchlistPanel
            demoMode={isDemoMode()}
            proUnlocked={proUnlocked}
            initialItems={items}
            alertPrefs={alertPrefs}
          />
          <div className="flex flex-col gap-6">
            <EarningsCalendarPanel locked={proLocked} proGateCta={proGateCta} />
            <MarketHeadlinesWidget watchlistSymbols={items.map((i) => i.symbol)} />
          </div>
        </div>
      </div>
    </WatchlistItemsProvider>
  );
}
