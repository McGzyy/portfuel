import { Suspense } from "react";
import { TabNav } from "@/components/layout/TabNav";
import { DashboardFeedFilters } from "@/components/dashboard/DashboardFeedFilters";
import { DashboardFeedSearch } from "@/components/dashboard/DashboardFeedSearch";
import { buildFeedHref, type FeedTab } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";

export function FeedToolbar({
  mode,
  feedFilter,
  searchQuery,
  resultCount,
  newCount = 0,
}: {
  mode: FeedTab;
  feedFilter: FeedFilter;
  searchQuery: string;
  resultCount: number;
  newCount?: number;
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
        {mode === "performing"
          ? "30-day top returns"
          : mode === "progress"
            ? "Highest target progress first"
            : "Newest first"}
        {newCount > 0 ? (
          <span className="font-semibold text-emerald-700">
            {" "}
            · {newCount} new since last visit
          </span>
        ) : null}
        {searchQuery ? ` · “${searchQuery}”` : ""}
      </p>
    </div>
  );
}
