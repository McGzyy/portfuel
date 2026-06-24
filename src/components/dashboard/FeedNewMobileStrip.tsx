"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildFeedHref, type FeedTab } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";
import { FeedMarkSeenButton } from "@/components/dashboard/FeedMarkSeenButton";
import { useWorkspaceActivityOptional } from "@/components/workspace/WorkspaceActivityProvider";

/** One-line new-call hint on mobile — full banner is desktop-only. */
export function FeedNewMobileStrip({
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

  if (newCount === 0) return null;

  const filterArg = feedFilter === "all" ? undefined : feedFilter;

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-1.5 sm:hidden">
      <p className="min-w-0 truncate text-xs font-semibold text-emerald-900">
        {newCount} new since last visit
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        {!showNewOnly ? (
          <Link
            href={buildFeedHref({
              tab: mode,
              filter: filterArg,
              q: searchQuery || undefined,
              newSince: true,
            })}
            className="text-[11px] font-semibold text-[var(--pf-red)] hover:underline"
          >
            New only
          </Link>
        ) : (
          <Link
            href={buildFeedHref({
              tab: mode,
              filter: filterArg,
              q: searchQuery || undefined,
            })}
            className="text-[11px] font-semibold text-[var(--pf-gray-700)] hover:underline"
          >
            Show all
          </Link>
        )}
        <FeedMarkSeenButton
          variant="ghost"
          label="Read"
          className="h-6 min-h-0 rounded px-1.5 text-[11px] font-semibold"
        />
      </div>
    </div>
  );
}
