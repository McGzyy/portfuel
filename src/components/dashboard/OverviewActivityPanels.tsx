import Link from "next/link";
import { HotTickersStrip, type HotTicker } from "@/components/dashboard/HotTickersStrip";
import { YourPositionsStrip } from "@/components/dashboard/YourPositionsStrip";
import { WorkspacePanel } from "@/components/dashboard/WorkspacePanel";
import { buildFeedHref } from "@/lib/dashboard/nav";
import type { CallCardData } from "@/components/calls/CallCard";
import { Button } from "@/components/ui/button";

export function OverviewActivityPanels({
  openCalls,
  username,
  hotTickers,
}: {
  openCalls: CallCardData[];
  username: string;
  hotTickers: HotTicker[];
}) {
  const showHot = hotTickers.length > 0;
  const showBook = openCalls.length > 0;

  if (!showHot && !showBook) {
    return (
      <div className="pf-workspace-panel px-6 py-10 text-center">
        <p className="font-medium text-[var(--pf-gray-700)]">Your workspace is warming up</p>
        <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
          Publish a call or check the member feed for symbols the community is trading.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/calls/new">
            <Button size="sm">New call</Button>
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
    <div className="grid gap-4 lg:grid-cols-2">
      {showBook ? (
        <YourPositionsStrip calls={openCalls} username={username} />
      ) : (
        <WorkspacePanel
          title="Your open calls"
          subtitle="Published theses still on your book"
          href={`/member/${username}`}
        >
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[var(--pf-gray-500)]">
              No active calls — targets hit or older theses roll off after 120 days.
            </p>
            <Link href="/calls/new" className="mt-4 inline-block">
              <Button size="sm">Publish a call</Button>
            </Link>
          </div>
        </WorkspacePanel>
      )}

      {showHot ? (
        <WorkspacePanel
          title="Hot in feed"
          subtitle="Most-mentioned symbols in latest member calls"
          href={buildFeedHref({})}
        >
          <div className="px-3 py-3">
            <HotTickersStrip tickers={hotTickers} embedded />
          </div>
        </WorkspacePanel>
      ) : null}
    </div>
  );
}
