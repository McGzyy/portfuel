import Link from "next/link";
import { DemoPreviewSourceSync } from "@/components/demo/DemoPreviewSourceSync";
import { DemoReadOnlyFeed } from "@/components/demo/DemoReadOnlyFeed";
import { FueledDeskSection } from "@/components/dashboard/FueledDeskSection";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { getDemoPreviewTier, isDemoPreviewPro } from "@/lib/demo/tier";
import { loadPreviewFeedCalls, mapPreviewCallsForCards } from "@/lib/demo/workspace-preview";
import { getDemoWatchlist } from "@/lib/watchlist/demo";
import { DEMO_PREVIEW_USER } from "@/lib/demo/fixtures";

export default async function DemoFeedPage() {
  const tier = await getDemoPreviewTier();
  const proLocked = !isDemoPreviewPro(tier);

  const { calls: latestRaw, source } = await loadPreviewFeedCalls("latest");
  const latestCalls = await mapPreviewCallsForCards(latestRaw);
  const memberCalls = latestCalls.filter((c) => !c.is_fueled);
  const fueledCalls = latestCalls.filter((c) => c.is_fueled).slice(0, 4);
  const summary = summarizeFeed(memberCalls);
  const watchlist = getDemoWatchlist(DEMO_PREVIEW_USER.id);

  return (
    <div className="space-y-6">
      <DemoPreviewSourceSync source={source} />

      <header className="pf-workspace-panel px-5 py-6 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Member feed
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--pf-black)]">
          Community calls
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          Verified member theses with live performance, votes, and chart markers — read-only in
          this preview. Toggle Member vs Pro in the banner to compare feed analytics.
        </p>
      </header>

      {fueledCalls.length > 0 ? (
        <FueledDeskSection calls={fueledCalls} readOnly deskHref="/demo/desk" />
      ) : null}

      {memberCalls.length > 0 ? (
        <>
          <FeedSummaryBar
            summary={summary}
            mode="latest"
            proLocked={proLocked}
            proGateCta="join"
          />
          <DemoReadOnlyFeed calls={memberCalls} />
        </>
      ) : (
        <div className="pf-workspace-panel px-6 py-12 text-center text-sm text-[var(--pf-gray-500)]">
          No member calls to preview yet.{" "}
          <Link href="/join" className="font-semibold text-[var(--pf-red)]">
            Join
          </Link>{" "}
          to publish the first thesis.
        </div>
      )}

      {proLocked ? (
        <ProMembershipStrip
          locked
          watchlistSymbols={watchlist.map((w) => w.symbol)}
          upgradeHref="/join"
        />
      ) : null}
    </div>
  );
}
