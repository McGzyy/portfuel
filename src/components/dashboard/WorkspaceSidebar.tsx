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
import { WORKSPACE_NAV_GROUPS, type DashboardNavIcon } from "@/lib/dashboard/nav";
import { WorkspaceGuide } from "@/components/dashboard/WorkspaceGuide";
import { DmUnreadBadge } from "@/components/messages/DmUnreadBadge";
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
  dmUnread = 0,
}: {
  username: string;
  displayName: string;
  isAdmin?: boolean;
  dmUnread?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="pf-workspace-sidebar flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-[var(--pf-border)] px-5 py-4">
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

      <div className="shrink-0 px-3 pt-2">
        <WorkspaceGuide />
      </div>

      <nav
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 pt-2"
        aria-label="Workspace"
      >
        {WORKSPACE_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
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
                      "flex gap-3 rounded-lg px-3 py-2 transition-all duration-150",
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
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold leading-tight">{item.label}</span>
                        {item.href === "/dashboard/messages" ? (
                          <DmUnreadBadge initial={dmUnread} />
                        ) : null}
                      </span>
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
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1.5 border-t border-[var(--pf-border)] p-3">
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
