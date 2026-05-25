import { Suspense } from "react";
import { TabNav } from "@/components/layout/TabNav";
import { DashboardFeedFilters } from "@/components/dashboard/DashboardFeedFilters";
import { DashboardFeedSearch } from "@/components/dashboard/DashboardFeedSearch";
import { buildFeedHref } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";

export function FeedToolbar({
  mode,
  feedFilter,
  searchQuery,
  resultCount,
}: {
  mode: "latest" | "performing";
  feedFilter: FeedFilter;
  searchQuery: string;
  resultCount: number;
}) {
  return (
    <div className="pf-feed-toolbar pf-feed-toolbar-premium space-y-4">
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Suspense fallback={<div className="h-10 flex-1 max-w-md rounded-lg bg-[var(--pf-gray-100)]" />}>
          <DashboardFeedSearch />
        </Suspense>
        <DashboardFeedFilters
          active={feedFilter}
          tab={mode}
          searchQuery={searchQuery || undefined}
        />
      </div>
      <p className="text-xs text-[var(--pf-gray-500)]">
        {resultCount} call{resultCount === 1 ? "" : "s"} ·{" "}
        {mode === "performing" ? "30-day top returns" : "Newest first"}
        {searchQuery ? ` · “${searchQuery}”` : ""}
      </p>
    </div>
  );
}
