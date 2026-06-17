import Link from "next/link";
import { HotTickersStrip, type HotTicker } from "@/components/dashboard/HotTickersStrip";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { buildFeedHref } from "@/lib/dashboard/nav";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

export function OverviewActivityPanels({
  hotTickers,
  feedHref,
}: {
  hotTickers: HotTicker[];
  feedHref?: string;
}) {
  if (hotTickers.length === 0) {
    return (
      <div className="pf-workspace-panel px-6 py-10 text-center">
        <p className="font-medium text-[var(--pf-gray-700)]">Community feed is quiet</p>
        <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
          Be the first to publish this week, or follow members from rankings when calls land.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={COPY.newCallHref}>
            <Button size="sm">{COPY.newCall}</Button>
          </Link>
          <Link href={buildFeedHref({})}>
            <Button variant="secondary" size="sm">
              Member feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <WorkspacePanel
      title="Hot in feed"
      subtitle="Symbols getting attention in recent member calls"
      href={feedHref ?? buildFeedHref({})}
    >
      <div className="pf-panel-inset">
        <HotTickersStrip tickers={hotTickers} embedded />
      </div>
    </WorkspacePanel>
  );
}
