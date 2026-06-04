"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Bell,
  Flame,
  LayoutDashboard,
  Rows3,
  ScanSearch,
  Calendar,
  GitCompare,
  MessageCircle,
  Plus,
  Trophy,
} from "lucide-react";
import { COPY } from "@/lib/copy";
import { WORKSPACE_NAV_GROUPS, type DashboardNavIcon } from "@/lib/dashboard/nav";
import { WorkspaceGuide } from "@/components/dashboard/WorkspaceGuide";
import { DmUnreadBadge } from "@/components/messages/DmUnreadBadge";
import { NotificationUnreadBadge } from "@/components/notifications/NotificationUnreadBadge";
import { cn } from "@/lib/utils";

const ICONS: Record<DashboardNavIcon, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  rows: Rows3,
  flame: Flame,
  bookmark: Bookmark,
  scan: ScanSearch,
  calendar: Calendar,
  compare: GitCompare,
  messages: MessageCircle,
  bell: Bell,
  trophy: Trophy,
};

export function WorkspaceSidebar({
  username,
  displayName,
  isAdmin,
  dmUnread = 0,
  notifUnread = 0,
}: {
  username: string;
  displayName: string;
  isAdmin?: boolean;
  dmUnread?: number;
  notifUnread?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="pf-workspace-sidebar flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-[var(--pf-border)] px-4 py-4">
        <p className="truncate text-sm font-bold text-[var(--pf-black)]">{displayName}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--pf-gray-500)]">
          @{username}
        </p>
      </div>

      <nav
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-3"
        aria-label="Workspace"
      >
        {WORKSPACE_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
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
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-[var(--pf-black)] text-white"
                        : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-black)]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-[var(--pf-red)]" : "text-[var(--pf-gray-400)]"
                      )}
                      strokeWidth={2.25}
                    />
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate">{item.label}</span>
                      {item.href === "/dashboard/messages" ? (
                        <DmUnreadBadge initial={dmUnread} />
                      ) : null}
                      {item.href === "/dashboard/notifications" ? (
                        <NotificationUnreadBadge initial={notifUnread} />
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-[var(--pf-border)] p-3">
        <Link
          href={COPY.newCallHref}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--pf-red)] px-3 py-2.5 text-sm font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {COPY.newCall}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
          <WorkspaceGuide />
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
              >
                Administration
              </Link>
            ) : null}
              <Link
                href={`/member/${username}`}
                className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
              >
                Settings
              </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
