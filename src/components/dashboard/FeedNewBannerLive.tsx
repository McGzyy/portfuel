"use client";

import { useEffect, useState } from "react";
import { FeedNewBanner } from "@/components/dashboard/FeedNewBanner";
import { useWorkspaceActivityOptional } from "@/components/workspace/WorkspaceActivityProvider";
import type { FeedTab } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";

export function FeedNewBannerLive({
  initialCount,
  mode,
  feedFilter,
  searchQuery,
  showNewOnly,
}: {
  initialCount: number;
  mode: FeedTab;
  feedFilter: FeedFilter;
  searchQuery: string;
  showNewOnly: boolean;
}) {
  const activity = useWorkspaceActivityOptional();
  const [newCount, setNewCount] = useState(initialCount);

  useEffect(() => {
    setNewCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (activity?.feedNewCount != null) {
      setNewCount(activity.feedNewCount);
    }
  }, [activity?.feedNewCount]);

  useEffect(() => {
    const onFeed = (e: Event) => {
      const detail = (e as CustomEvent<{ feedNewCount?: number }>).detail;
      if (detail?.feedNewCount != null) setNewCount(detail.feedNewCount);
    };
    window.addEventListener("portfuel:feed-activity-changed", onFeed);
    return () => window.removeEventListener("portfuel:feed-activity-changed", onFeed);
  }, []);

  return (
    <FeedNewBanner
      newCount={newCount}
      mode={mode}
      feedFilter={feedFilter}
      searchQuery={searchQuery}
      showNewOnly={showNewOnly}
    />
  );
}
