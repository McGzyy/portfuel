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
      <div className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 text-sm text-[var(--pf-gray-600)] sm:px-4 sm:py-3">
        <p className="font-medium text-[var(--pf-gray-800)]">No new calls in this view</p>
        <p className="mt-1 text-xs text-[var(--pf-gray-600)]">
          Everything here was already on the feed when you last visited, or you marked the feed read.
        </p>
        <Link href={buildFeedHref({ tab: mode, filter: filterArg, q: searchQuery || undefined })} className="mt-2 inline-block sm:mt-3">
          <Button variant="secondary" size="sm">
            Show all calls
          </Button>
        </Link>
      </div>
    );
  }

  if (newCount === 0) return null;

  return (
    <div className="hidden flex-col gap-2.5 rounded-lg border border-emerald-200 bg-white px-3 py-2.5 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 sm:h-9 sm:w-9">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--pf-black)]">
            {newCount} new call{newCount === 1 ? "" : "s"} since your last visit
          </p>
          <p className="mt-0.5 hidden text-xs text-[var(--pf-gray-600)] sm:block">
            Badges clear when you leave the feed or tap mark all read.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 pl-10 sm:pl-0">
        {!showNewOnly ? (
          <Link
            href={buildFeedHref({
              tab: mode,
              filter: filterArg,
              q: searchQuery || undefined,
              newSince: true,
            })}
          >
            <Button size="sm" className="h-8 px-3 text-xs">
              Show new only
            </Button>
          </Link>
        ) : (
          <Link
            href={buildFeedHref({
              tab: mode,
              filter: filterArg,
              q: searchQuery || undefined,
            })}
          >
            <Button variant="secondary" size="sm" className="h-8 px-3 text-xs">
              Show all
            </Button>
          </Link>
        )}
        <FeedMarkSeenButton className="h-8 px-3 text-xs" />
      </div>
    </div>
  );
}
