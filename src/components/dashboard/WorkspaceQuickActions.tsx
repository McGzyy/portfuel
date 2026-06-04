import Link from "next/link";
import {
  Bookmark,
  Flame,
  LayoutDashboard,
  Plus,
  Rows3,
  Trophy,
} from "lucide-react";
import { WORKSPACE_QUICK_ACTIONS } from "@/lib/dashboard/quick-actions";
import type { DashboardNavIcon } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<DashboardNavIcon | "plus", typeof Plus> = {
  plus: Plus,
  "layout-dashboard": LayoutDashboard,
  rows: Rows3,
  flame: Flame,
  bookmark: Bookmark,
  scan: LayoutDashboard,
  compare: LayoutDashboard,
  messages: LayoutDashboard,
  trophy: Trophy,
};

export function WorkspaceQuickActions() {
  return (
    <nav
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
      aria-label="Quick actions"
    >
      {WORKSPACE_QUICK_ACTIONS.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "pf-quick-action group",
              item.primary && "pf-quick-action-primary"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                item.primary
                  ? "border-white/20 bg-white/15 text-white"
                  : "border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[var(--pf-gray-600)] group-hover:border-[var(--pf-gray-300)] group-hover:text-[var(--pf-black)]"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span
              className={cn(
                "text-sm font-bold tracking-tight",
                item.primary ? "text-white" : "text-[var(--pf-black)]"
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "text-xs leading-snug",
                item.primary ? "text-slate-300" : "text-[var(--pf-gray-500)]"
              )}
            >
              {item.description}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
