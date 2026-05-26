"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Flame,
  LayoutDashboard,
  Rows3,
  ScanSearch,
  GitCompare,
  MessageCircle,
  Plus,
  ExternalLink,
  Shield,
} from "lucide-react";
import { DASHBOARD_NAV, type DashboardNavIcon } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<DashboardNavIcon, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  rows: Rows3,
  flame: Flame,
  bookmark: Bookmark,
  scan: ScanSearch,
  compare: GitCompare,
  messages: MessageCircle,
};

export function WorkspaceSidebar({
  username,
  displayName,
  isAdmin,
}: {
  username: string;
  displayName: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="pf-workspace-sidebar flex h-full w-full flex-col">
      <div className="border-b border-[var(--pf-border)] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Member workspace
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--pf-black)]">PortFuel</p>
      </div>

      <div className="mx-3 mt-4 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-3">
        <p className="truncate text-sm font-semibold text-[var(--pf-black)]">{displayName}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--pf-gray-500)]">
          @{username}
        </p>
        {isAdmin ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--pf-red-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--pf-red)]">
            <Shield className="h-3 w-3" strokeWidth={2.5} />
            Admin
          </span>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 p-3 pt-4" aria-label="Workspace">
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
                "flex gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
                active
                  ? "bg-[var(--pf-black)] text-white shadow-[var(--pf-shadow-md)]"
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
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--pf-gray-500)] hover:bg-[var(--pf-gray-50)] hover:text-[var(--pf-black)]"
        >
          Profile
        </Link>
      </div>
    </aside>
  );
}
