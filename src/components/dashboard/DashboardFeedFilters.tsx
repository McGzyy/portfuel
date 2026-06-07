import Link from "next/link";
import { buildFeedHref, type FeedTab } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "All members" },
  { key: "following", label: "Following" },
  { key: "equity", label: "Stocks" },
  { key: "crypto", label: "Crypto" },
] as const;

export function DashboardFeedFilters({
  active,
  tab,
  searchQuery,
  newCount = 0,
  showNewOnly = false,
}: {
  active: string;
  tab: FeedTab;
  searchQuery?: string;
  newCount?: number;
  showNewOnly?: boolean;
}) {
  const tabArg = tab === "latest" ? undefined : tab;
  const filterArg = active === "all" ? undefined : active;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter feed">
      {newCount > 0 ? (
        <Link
          href={
            showNewOnly
              ? buildFeedHref({ tab: tabArg, filter: filterArg, q: searchQuery })
              : buildFeedHref({
                  tab: tabArg,
                  filter: filterArg,
                  q: searchQuery,
                  newSince: true,
                })
          }
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
            showNewOnly
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          )}
        >
          New ({newCount})
        </Link>
      ) : null}
      {filters.map((f) => {
        const href = buildFeedHref({
          tab: tabArg,
          filter: f.key === "all" ? undefined : f.key,
          q: searchQuery,
          newSince: showNewOnly || undefined,
        });
        const isActive = !showNewOnly && active === f.key;
        return (
          <Link
            key={f.key}
            href={href}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              isActive
                ? "pf-pill-active rounded-full border px-3 py-1 text-xs font-semibold"
                : "pf-pill-inactive rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:bg-[var(--pf-gray-50)]"
            )}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}
