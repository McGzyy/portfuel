import Link from "next/link";
import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "All" },
  { key: "fueled", label: "Fueled" },
  { key: "equity", label: "Stocks" },
  { key: "crypto", label: "Crypto" },
] as const;

export function buildDashboardHref(
  opts: { tab?: "performing"; filter?: string; q?: string }
): string {
  const params = new URLSearchParams();
  if (opts.tab === "performing") params.set("tab", "performing");
  if (opts.filter && opts.filter !== "all") params.set("filter", opts.filter);
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  const qs = params.toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}

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
        const href = buildDashboardHref({
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
