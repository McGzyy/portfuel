import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TabNav } from "@/components/layout/TabNav";
import { CallCard } from "@/components/calls/CallCard";
import { FeedSummaryBar } from "@/components/dashboard/FeedSummaryBar";
import { DashboardFeedFilters } from "@/components/dashboard/DashboardFeedFilters";
import { DashboardFeedSearch } from "@/components/dashboard/DashboardFeedSearch";
import { Button } from "@/components/ui/button";
import {
  filterCallsFeed,
  filterCallsBySearch,
  type FeedFilter,
} from "@/lib/calls/filter-feed";
import { summarizeFeed } from "@/lib/calls/feed-summary";
import { getHotTickersFromCalls } from "@/lib/calls/hot-tickers";
import { HotTickersStrip } from "@/components/dashboard/HotTickersStrip";
import { loadFeedCalls, mapCallForCard } from "@/lib/dashboard/data";
import { buildFeedHref } from "@/lib/dashboard/nav";

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
  const hotTickers = getHotTickersFromCalls(mapped);

  const filterLabel =
    feedFilter === "all"
      ? "All"
      : feedFilter === "fueled"
        ? "Fueled"
        : feedFilter === "crypto"
          ? "Crypto"
          : "Stocks";

  return (
    <>
      <PageHeader
        title="Member feed"
        description="Community member calls only — official Fueled desk theses are on the Fueled desk tab. Filter, search, and sort below."
        action={
          <Link href="/calls/new">
            <Button>
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New call
            </Button>
          </Link>
        }
      />

      <div className="mt-6 space-y-4">
        <TabNav
          tabs={[
            {
              href: buildFeedHref({
                filter: feedFilter === "all" ? undefined : feedFilter,
                q: searchQuery || undefined,
              }),
              label: "Latest",
              active: mode === "latest",
            },
            {
              href: buildFeedHref({
                tab: "performing",
                filter: feedFilter === "all" ? undefined : feedFilter,
                q: searchQuery || undefined,
              }),
              label: "Performing",
              active: mode === "performing",
            },
          ]}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Suspense fallback={null}>
            <DashboardFeedSearch />
          </Suspense>
          <DashboardFeedFilters
            active={feedFilter}
            tab={mode}
            searchQuery={searchQuery || undefined}
          />
        </div>

        <p className="text-xs text-[var(--pf-gray-500)]">
          {filterLabel}
          {searchQuery ? ` · “${searchQuery}”` : ""} · {mapped.length} call
          {mapped.length === 1 ? "" : "s"} ·{" "}
          {mode === "performing" ? "30-day movers by return" : "newest first"}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <FeedSummaryBar summary={feedSummary} mode={mode} />
        <HotTickersStrip tickers={hotTickers} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {mapped.length === 0 ? (
          <div className="pf-empty lg:col-span-2">
            <p className="font-medium text-[var(--pf-gray-700)]">No calls match this view</p>
            <p className="mt-1 text-sm">Change filters or search, or publish a new thesis.</p>
            <Link href="/calls/new" className="mt-4 inline-block">
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
