import { Suspense } from "react";
import { TabNav } from "@/components/layout/TabNav";
import { DashboardFeedFilters } from "@/components/dashboard/DashboardFeedFilters";
import { DashboardFeedSearch } from "@/components/dashboard/DashboardFeedSearch";
import { FeedNewBannerLive } from "@/components/dashboard/FeedNewBannerLive";
import { FeedNewMobileStrip } from "@/components/dashboard/FeedNewMobileStrip";
import { buildFeedHref, type FeedTab } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";
import { FeedRefreshButton } from "@/components/dashboard/FeedRefreshButton";
import { FeedSavedFilters } from "@/components/dashboard/FeedSavedFilters";
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
    <>
      <div className="pf-feed-toolbar pf-feed-toolbar-premium pf-feed-toolbar-sticky-core max-sm:static max-sm:shadow-sm sm:pf-feed-toolbar-sticky">
        <div className="flex items-center gap-2 sm:hidden">
          <TabNav
            className="pf-feed-tab-nav min-w-0 flex-1"
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
          <FeedRefreshButton iconOnly />
        </div>

        <FeedNewMobileStrip
          initialCount={newCount}
          mode={mode}
          feedFilter={feedFilter}
          searchQuery={searchQuery}
          showNewOnly={showNewOnly}
        />

        <FeedNewBannerLive
          initialCount={newCount}
          mode={mode}
          feedFilter={feedFilter}
          searchQuery={searchQuery}
          showNewOnly={showNewOnly}
        />

        <TabNav
          className="pf-feed-tab-nav hidden w-full max-w-full sm:inline-flex"
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <Suspense fallback={<div className="h-10 w-full rounded-lg bg-[var(--pf-gray-100)] sm:max-w-md" />}>
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
      </div>

      <div className="pf-feed-toolbar-extras space-y-2.5 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white/80 px-3.5 py-3 sm:space-y-3 sm:px-4 sm:py-3">
        <div className="hidden flex-wrap items-center justify-between gap-3 sm:flex">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Browse & filter
          </p>
          <FeedRefreshButton />
        </div>
        <FeedSavedFilters
          feedFilter={feedFilter}
          tab={mode}
          searchQuery={searchQuery}
          showNewOnly={showNewOnly}
        />
        <p className="hidden text-xs text-[var(--pf-gray-500)] sm:block">
          {quotesRefreshLabel()} · Use <span className="font-medium">Update prices</span> for
          immediate marks
        </p>
      </div>
    </>
  );
}
