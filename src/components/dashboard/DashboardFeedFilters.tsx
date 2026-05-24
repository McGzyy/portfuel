import Link from "next/link";
import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "All", href: "/dashboard" },
  { key: "fueled", label: "Fueled", href: "/dashboard?filter=fueled" },
  { key: "equity", label: "Stocks", href: "/dashboard?filter=equity" },
  { key: "crypto", label: "Crypto", href: "/dashboard?filter=crypto" },
] as const;

export function DashboardFeedFilters({
  active,
  tab,
}: {
  active: string;
  tab: "latest" | "performing";
}) {
  const tabSuffix = tab === "performing" ? "&tab=performing" : "";

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter feed">
      {filters.map((f) => {
        const href =
          f.key === "all"
            ? tab === "performing"
              ? "/dashboard?tab=performing"
              : "/dashboard"
            : `${f.href}${tabSuffix}`;
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
