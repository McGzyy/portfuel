import Link from "next/link";
import { BarChart3, Calendar, Newspaper, Search } from "lucide-react";
import {
  ContextRailBlock,
  ContextRailModule,
} from "@/components/workspace/ContextRailModule";
import type { ResearchHubTab } from "@/lib/dashboard/research-hub";
import { cn } from "@/lib/utils";

const TABS: Array<{ id: ResearchHubTab; label: string; href: string; icon: typeof Search }> = [
  { id: "compare", label: "Compare", href: "/dashboard/research?tab=compare", icon: BarChart3 },
  { id: "screener", label: "Screener", href: "/dashboard/research?tab=screener", icon: Search },
  { id: "earnings", label: "Earnings", href: "/dashboard/research?tab=earnings", icon: Calendar },
  { id: "news", label: "Headlines", href: "/dashboard/research?tab=news", icon: Newspaper },
];

export function ResearchContextRail({
  activeTab,
  watchlistCount,
}: {
  activeTab: ResearchHubTab;
  watchlistCount: number;
}) {
  return (
    <ContextRailModule eyebrow="Pro" title="Research pulse" ariaLabel="Research context">
      <ContextRailBlock title="Hub">
        <div className="flex flex-col gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-colors",
                  active
                    ? "border-[var(--pf-red)] bg-[var(--pf-red-muted)] text-[var(--pf-red)]"
                    : "border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[var(--pf-gray-700)] hover:bg-white"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                {tab.label}
              </Link>
            );
          })}
        </div>
        {watchlistCount > 0 ? (
          <p className="mt-2 text-[11px] text-[var(--pf-gray-500)]">
            {watchlistCount} watchlist symbol{watchlistCount === 1 ? "" : "s"} ready for compare.
          </p>
        ) : null}
      </ContextRailBlock>
    </ContextRailModule>
  );
}
