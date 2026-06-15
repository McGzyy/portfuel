import Link from "next/link";
import { Flame, LayoutGrid } from "lucide-react";
import { DemoLockedSection } from "@/components/demo/DemoLockedSection";
import { DemoJoinFooter } from "@/components/demo/DemoJoinFooter";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import { getDemoPreviewTier, isDemoPreviewPro } from "@/lib/demo/tier";
import { getDemoWatchlist } from "@/lib/watchlist/demo";
import { DEMO_PREVIEW_USER } from "@/lib/demo/fixtures";

/** Synthetic feed summary — illustrates Pro analytics strip, not real calls. */
const DEMO_FEED_SUMMARY = {
  count: 24,
  avgReturnPct: 4.2,
  winners: 14,
  losers: 6,
  fueledCount: 4,
  longCount: 17,
  shortCount: 7,
  avgTargetProgress: 48,
};

export default async function DemoFeedPage() {
  const tier = await getDemoPreviewTier();
  const proLocked = !isDemoPreviewPro(tier);
  const watchlist = getDemoWatchlist(DEMO_PREVIEW_USER.id);

  return (
    <div className="space-y-6">
      <header className="pf-workspace-panel px-5 py-6 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Member feed
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--pf-black)]">
          Community calls
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          The member feed is gated in preview so paid research stays behind membership. Toggle
          Member vs Pro on the overview to compare analytics depth.
        </p>
      </header>

      <FeedSummaryBar
        summary={DEMO_FEED_SUMMARY}
        mode="latest"
        proLocked={proLocked}
        proGateCta="join"
      />

      <DemoLockedSection variant="feed" icon={LayoutGrid} />

      <DemoLockedSection variant="desk" icon={Flame} compact />

      {proLocked ? (
        <ProMembershipStrip
          locked
          watchlistSymbols={watchlist.map((w) => w.symbol)}
          upgradeHref="/join"
        />
      ) : (
        <div className="rounded-xl border border-sky-200/60 bg-sky-50/40 px-5 py-4 text-sm text-[var(--pf-gray-700)]">
          <strong className="text-[var(--pf-black)]">Pro preview:</strong> feed analytics strip
          above is unlocked — individual theses still require membership.{" "}
          <Link href="/join" className="font-semibold text-[var(--pf-red)] hover:underline">
            Get access
          </Link>
        </div>
      )}

      <DemoJoinFooter tier={tier} />
    </div>
  );
}
