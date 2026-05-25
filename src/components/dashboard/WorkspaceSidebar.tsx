"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Flame,
  LayoutDashboard,
  Rows3,
  Plus,
  ExternalLink,
} from "lucide-react";
import { DASHBOARD_NAV, type DashboardNavIcon } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<DashboardNavIcon, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  rows: Rows3,
  flame: Flame,
  bookmark: Bookmark,
};

export function WorkspaceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="pf-workspace-sidebar flex h-full w-full flex-col">
      <div className="border-b border-[var(--pf-border)] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Workspace
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--pf-black)]">PortFuel</p>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Workspace">
        {DASHBOARD_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            item.exact === true
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex gap-3 rounded-lg px-3 py-2.5 transition-colors",
                active
                  ? "bg-[var(--pf-black)] text-white shadow-[var(--pf-shadow-sm)]"
                  : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-black)]"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  active ? "text-[var(--pf-red)]" : "text-[var(--pf-gray-400)]"
                )}
                strokeWidth={2.25}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{item.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[11px] leading-snug",
                    active ? "text-slate-400" : "text-[var(--pf-gray-400)]"
                  )}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-[var(--pf-border)] p-3">
        <Link
          href="/calls/new"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--pf-red)] px-3 py-2.5 text-sm font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New call
        </Link>
        <Link
          href="/rankings"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-50)] hover:text-[var(--pf-black)]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Rankings
        </Link>
      </div>
    </aside>
  );
}
