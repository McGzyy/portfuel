import Link from "next/link";
import { buildFeedHref } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "All members" },
  { key: "equity", label: "Stocks" },
  { key: "crypto", label: "Crypto" },
] as const;

export function DashboardFeedFilters({
  active,
  tab,
  searchQuery,
}: {
  active: string;
  tab: "latest" | "performing";
  searchQuery?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter feed">
      {filters.map((f) => {
        const href = buildFeedHref({
          tab: tab === "performing" ? "performing" : undefined,
          filter: f.key === "all" ? undefined : f.key,
          q: searchQuery,
        });
        const isActive = active === f.key;
        return (
          <Link
            key={f.key}
            href={href}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              isActive
                ? "border-[var(--pf-black)] bg-[var(--pf-black)] text-white"
                : "border-[var(--pf-border)] bg-white text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-50)]"
            )}
          >
            {f.label}
          </Link>
        );
      })}
    </div>
  );
}
