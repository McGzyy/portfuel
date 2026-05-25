import Link from "next/link";
import { CallCard } from "@/components/calls/CallCard";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { FeedToolbar } from "@/components/dashboard/FeedToolbar";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { Button } from "@/components/ui/button";
import {
  filterCallsFeed,
  filterCallsBySearch,
  type FeedFilter,
} from "@/lib/calls/filter-feed";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { loadFeedCalls, mapCallForCard } from "@/lib/dashboard/data";

function parseFilter(raw?: string): FeedFilter {
  if (raw === "fueled" || raw === "equity" || raw === "crypto") return raw;
  return "all";
}

export default async function DashboardFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string; q?: string }>;
}) {
  const { tab, filter: filterParam, q } = await searchParams;
  const mode = tab === "performing" ? "performing" : "latest";
  const feedFilter = parseFilter(filterParam);
  const searchQuery = q?.trim() ?? "";

  const allFeedCalls = await loadFeedCalls(mode);
  let calls = filterCallsFeed(
    allFeedCalls.filter((c) => !c.is_fueled),
    feedFilter === "fueled" ? "all" : feedFilter
  );
  calls = filterCallsBySearch(calls, searchQuery);
  const mapped = calls.map(mapCallForCard);
  const feedSummary = summarizeFeed(mapped);

  return (
    <>
      <WorkspacePageHeader
        title="Member feed"
        description="Every community thesis in one place. Search, filter by asset class, and switch between latest and top performers."
      />

      <FeedToolbar
        mode={mode}
        feedFilter={feedFilter}
        searchQuery={searchQuery}
        resultCount={mapped.length}
      />

      {feedSummary.count > 0 ? (
        <div className="mt-6">
          <FeedSummaryBar summary={feedSummary} mode={mode} />
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {mapped.length === 0 ? (
          <div className="pf-workspace-panel px-6 py-16 text-center">
            <p className="font-medium text-[var(--pf-gray-700)]">No calls match this view</p>
            <p className="mt-2 text-sm text-[var(--pf-gray-500)]">
              Try different filters or publish a new thesis.
            </p>
            <Link href="/calls/new" className="mt-6 inline-block">
              <Button>Submit a call</Button>
            </Link>
          </div>
        ) : (
          mapped.map((call) => (
            <CallCard key={call.id} call={call} interactive />
          ))
        )}
      </div>
    </>
  );
}
