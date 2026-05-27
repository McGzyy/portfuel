import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedMarkSeenButton } from "@/components/dashboard/FeedMarkSeenButton";
import { buildFeedHref, type FeedTab } from "@/lib/dashboard/nav";
import type { FeedFilter } from "@/lib/calls/filter-feed";

export function FeedNewBanner({
  newCount,
  mode,
  feedFilter,
  searchQuery,
  showNewOnly,
}: {
  newCount: number;
  mode: FeedTab;
  feedFilter: FeedFilter;
  searchQuery: string;
  showNewOnly: boolean;
}) {
  if (newCount === 0 && !showNewOnly) return null;

  const filterArg = feedFilter === "all" ? undefined : feedFilter;

  if (showNewOnly && newCount === 0) {
    return (
      <div className="mt-4 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-sm text-[var(--pf-gray-600)]">
        <p className="font-medium text-[var(--pf-gray-700)]">No new calls in this view</p>
        <p className="mt-1 text-xs">
          Everything here was already on the feed when you last visited, or you marked the feed read.
        </p>
        <Link href={buildFeedHref({ tab: mode, filter: filterArg, q: searchQuery || undefined })} className="mt-3 inline-block">
          <Button variant="secondary" size="sm">
            Show all calls
          </Button>
        </Link>
      </div>
    );
  }

  if (newCount === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            {newCount} new call{newCount === 1 ? "" : "s"} since your last visit
          </p>
          <p className="mt-0.5 text-xs text-emerald-800/90">
            Badges clear when you leave the feed or tap mark all read.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!showNewOnly ? (
          <Link
            href={buildFeedHref({
              tab: mode,
              filter: filterArg,
              q: searchQuery || undefined,
              newSince: true,
            })}
          >
            <Button size="sm">Show new only</Button>
          </Link>
        ) : (
          <Link
            href={buildFeedHref({
              tab: mode,
              filter: filterArg,
              q: searchQuery || undefined,
            })}
          >
            <Button variant="secondary" size="sm">
              Show all
            </Button>
          </Link>
        )}
        <FeedMarkSeenButton />
      </div>
    </div>
  );
}
