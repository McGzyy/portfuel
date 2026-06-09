import { Suspense } from "react";
import { TabNav } from "@/components/layout/TabNav";
import { DashboardFeedFilters } from "@/components/dashboard/DashboardFeedFilters";
import { DashboardFeedSearch } from "@/components/dashboard/DashboardFeedSearch";
import { FeedNewBanner } from "@/components/dashboard/FeedNewBanner";
import { buildFeedHref, type FeedTab } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";
import { FeedRefreshButton } from "@/components/dashboard/FeedRefreshButton";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";

export function FeedToolbar({
  mode,
  feedFilter,
  searchQuery,
  newCount = 0,
  showNewOnly = false,
  fueledCount = 0,
}: {
  mode: FeedTab;
  feedFilter: FeedFilter;
  searchQuery: string;
  newCount?: number;
  showNewOnly?: boolean;
  fueledCount?: number;
}) {
  const filterArg = feedFilter === "all" ? undefined : feedFilter;
  const qArg = searchQuery || undefined;

  const tabBase = {
    filter: filterArg,
    q: qArg,
    newSince: showNewOnly || undefined,
  };

  return (
    <div className="pf-feed-toolbar pf-feed-toolbar-premium pf-feed-toolbar-sticky space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Browse & filter
        </p>
        <FeedRefreshButton />
      </div>
      <FeedNewBanner
        newCount={newCount}
        mode={mode}
        feedFilter={feedFilter}
        searchQuery={searchQuery}
        showNewOnly={showNewOnly}
      />
      <TabNav
        tabs={[
          {
            href: buildFeedHref(tabBase),
            label: "Latest",
            active: mode === "latest",
          },
          {
            href: buildFeedHref({ ...tabBase, tab: "performing" }),
            label: "Performing",
            active: mode === "performing",
          },
          {
            href: buildFeedHref({ ...tabBase, tab: "progress" }),
            label: "Near target",
            active: mode === "progress",
          },
        ]}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Suspense fallback={<div className="h-10 flex-1 max-w-md rounded-lg bg-[var(--pf-gray-100)]" />}>
          <DashboardFeedSearch />
        </Suspense>
        <DashboardFeedFilters
          active={feedFilter}
          tab={mode}
          searchQuery={searchQuery || undefined}
          newCount={newCount}
          showNewOnly={showNewOnly}
          fueledCount={fueledCount}
        />
      </div>
      <p className="text-xs text-[var(--pf-gray-500)]">
        {quotesRefreshLabel()} · Use <span className="font-medium">Update prices</span> for
        immediate marks
      </p>
    </div>
  );
}
