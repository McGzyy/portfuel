import Link from "next/link";
import { DemoPreviewSourceSync } from "@/components/demo/DemoPreviewSourceSync";
import { FeedPreviewList } from "@/components/dashboard/FeedPreviewList";
import { FueledDeskPreview } from "@/components/dashboard/FueledDeskPreview";
import { FueledTrackRecordPanel } from "@/components/dashboard/FueledTrackRecordPanel";
import { OverviewActivityPanels } from "@/components/dashboard/OverviewActivityPanels";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import type { CallPreviewData } from "@/components/dashboard/CallPreviewRow";
import type { CallCardData } from "@/components/calls/CallCard";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import {
  loadPreviewDeskBrief,
  loadPreviewFeedCalls,
  loadPreviewFueledTrackRecord,
  mapPreviewCallsForCards,
} from "@/lib/demo/workspace-preview";
import { formatPct } from "@/lib/utils";

function toPreview(c: CallCardData): CallPreviewData {
  return {
    id: c.id,
    symbol: c.symbol,
    direction: c.direction,
    thesis: c.thesis,
    called_at: c.called_at,
    return_pct: c.return_pct,
    display_name: c.display_name,
    username: c.username,
    is_fueled: c.is_fueled,
    entry_price: c.entry_price,
    last_price: c.last_price,
  };
}

export default async function DemoOverviewPage() {
  const [{ calls: latestRaw, source }, { record: fueledTrackRecord }, { brief: deskBrief }] =
    await Promise.all([
      loadPreviewFeedCalls("latest"),
      loadPreviewFueledTrackRecord(),
      loadPreviewDeskBrief(),
    ]);

  const latestCalls = await mapPreviewCallsForCards(latestRaw);
  const communityPulse = summarizeFeed(latestCalls);
  const hotTickers = getHotTickersFromCalls(
    latestCalls.map((c) => ({ symbol: c.symbol, return_pct: c.return_pct })),
    8
  );

  const fueledCalls = latestCalls.filter((c) => c.is_fueled);
  const fueledPreviews = fueledCalls.slice(0, 3).map((c) => toPreview(c));
  const latestPreviews = latestCalls
    .filter((c) => !c.is_fueled)
    .slice(0, 5)
    .map((c) => toPreview(c));

  const avgPulse = communityPulse.avgReturnPct;

  return (
    <div className="space-y-6">
      <DemoPreviewSourceSync source={source} />

      <header className="pf-workspace-panel px-5 py-6 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Overview
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--pf-black)]">
          Member workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          This is what active members see after login — community feed, Fueled desk research, and
          performance tracking on every call.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="pf-workspace-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Community pulse
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--pf-black)]">
            {communityPulse.count > 0 ? formatPct(avgPulse) : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            {communityPulse.count > 0
              ? `Avg return · ${communityPulse.count} active calls`
              : "Awaiting community calls"}
          </p>
        </div>
        <div className="pf-workspace-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Fueled desk
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--pf-black)]">
            {fueledTrackRecord.totalCalls}
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">House research calls tracked</p>
        </div>
        <div className="pf-workspace-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Hot tickers
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--pf-black)]">
            {hotTickers.length}
          </p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">Most discussed this week</p>
        </div>
        <div className="pf-workspace-panel p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Your book
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--pf-gray-700)]">Members only</p>
          <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
            Publish calls · track open positions
          </p>
        </div>
      </div>

      <FueledTrackRecordPanel record={fueledTrackRecord} />

      <OverviewActivityPanels hotTickers={hotTickers} feedHref="/demo/feed" />

      <section className="pf-fueled-desk rounded-[var(--pf-radius-lg)] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Fueled desk
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">House research lane</h2>
          </div>
          <Link
            href="/demo/desk"
            className="text-xs font-semibold text-red-300 hover:text-red-200"
          >
            Open desk →
          </Link>
        </div>
        <FueledDeskPreview
          featured={fueledPreviews[0] ?? null}
          totalDeskCalls={fueledCalls.length}
          weeklyNote={deskBrief.weeklyNote}
        />
      </section>

      {latestPreviews.length > 0 ? (
        <WorkspacePanel title="Latest member calls" href="/demo/feed">
          <FeedPreviewList previews={latestPreviews} />
        </WorkspacePanel>
      ) : null}
    </div>
  );
}
