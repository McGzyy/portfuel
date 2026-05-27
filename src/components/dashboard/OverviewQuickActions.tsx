import Link from "next/link";
import { BarChart3, Flame, LayoutGrid, Plus, Star } from "lucide-react";
import { COPY } from "@/lib/copy";

const actions = [
  {
    href: COPY.newCallHref,
    label: COPY.publishCall,
    description: "Publish a new thesis",
    icon: Plus,
    primary: true,
  },
  {
    href: "/dashboard/feed",
    label: "Member feed",
    description: "Browse all member calls",
    icon: LayoutGrid,
  },
  {
    href: "/dashboard/desk",
    label: "Fueled desk",
    description: "Official PortFuel theses",
    icon: Flame,
  },
  {
    href: "/dashboard/watchlist",
    label: "Watchlist",
    description: "Track symbols & ticker lookup",
    icon: Star,
  },
  {
    href: "/dashboard/rankings",
    label: "Rankings",
    description: "Leaderboard & scores",
    icon: BarChart3,
  },
] as const;

export function OverviewQuickActions() {
  return (
    <section aria-labelledby="overview-actions-heading">
      <h2
        id="overview-actions-heading"
        className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]"
      >
        Workspace
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map(({ href, label, description, icon: Icon, ...rest }) => (
          <Link
            key={label}
            href={href}
            className={
              "primary" in rest && rest.primary
                ? "pf-elite-panel flex items-start gap-3 border-[var(--pf-red)]/20 p-4 transition-shadow hover:shadow-[var(--pf-shadow-md)]"
                : "pf-stat-tile flex items-start gap-3 p-4 transition-shadow hover:shadow-[var(--pf-shadow-md)]"
            }
          >
            <span
              className={
                "primary" in rest && rest.primary
                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pf-red)] text-white"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pf-gray-100)] text-[var(--pf-gray-700)]"
              }
            >
              <Icon className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-sm font-bold text-[var(--pf-black)]">{label}</span>
              <span className="mt-0.5 block text-xs text-[var(--pf-gray-500)]">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
