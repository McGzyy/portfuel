"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Bell,
  BookOpen,
  Flame,
  LayoutDashboard,
  Rows3,
  ScanSearch,
  Calendar,
  GitCompare,
  LifeBuoy,
  MessageCircle,
  Notebook,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  WORKSPACE_NAV_GROUPS,
  isWorkspaceNavItemActive,
  type DashboardNavIcon,
} from "@/lib/dashboard/nav";
import { WorkspaceSidebarFooter } from "@/components/dashboard/WorkspaceSidebarFooter";
import { DmUnreadBadge } from "@/components/messages/DmUnreadBadge";
import { NotificationUnreadBadge } from "@/components/notifications/NotificationUnreadBadge";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { cn } from "@/lib/utils";

const ICONS: Record<DashboardNavIcon, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  "book-open": BookOpen,
  rows: Rows3,
  flame: Flame,
  bookmark: Bookmark,
  scan: ScanSearch,
  calendar: Calendar,
  compare: GitCompare,
  messages: MessageCircle,
  bell: Bell,
  trophy: Trophy,
  notebook: Notebook,
  help: LifeBuoy,
  sparkles: Sparkles,
};

export function WorkspaceSidebar({
  username,
  displayName,
  avatarUrl,
  isAdmin,
  dmUnread = 0,
  notifUnread = 0,
  whatsNewUnread = 0,
}: {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  dmUnread?: number;
  notifUnread?: number;
  whatsNewUnread?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="pf-workspace-sidebar grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto]">
      <div className="pf-sidebar-profile shrink-0 border-b border-[var(--pf-border)]">
        <Link href={`/member/${username}`} className="flex items-center gap-2.5">
          <MemberAvatar displayName={displayName} username={username} avatarUrl={avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-bold leading-tight text-[var(--foreground)]">
              {displayName}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-[var(--pf-gray-500)]">
              @{username}
            </p>
          </div>
        </Link>
      </div>

      <nav
        className="pf-sidebar-nav-scroll min-h-0 overflow-y-auto overscroll-contain px-3 py-2.5 lg:overflow-y-hidden"
        aria-label="Workspace"
      >
        {WORKSPACE_NAV_GROUPS.map((group) => (
          <div key={group.title} className="pf-sidebar-nav-group">
            <p className="pf-sidebar-nav-group-label">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isWorkspaceNavItemActive(pathname, item, { username });

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "pf-sidebar-nav-item",
                      active
                        ? "pf-nav-link-active bg-[var(--pf-black)] text-white"
                        : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-[var(--pf-red)]" : "text-[var(--pf-gray-400)]"
                      )}
                      strokeWidth={2.25}
                    />
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
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

      <WorkspaceSidebarFooter
        username={username}
        isAdmin={isAdmin}
        whatsNewUnread={whatsNewUnread}
      />
    </aside>
  );
}
