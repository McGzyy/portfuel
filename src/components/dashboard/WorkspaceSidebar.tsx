"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Bell,
  BookOpen,
  Flame,
  LayoutDashboard,
  MessageCircle,
  Notebook,
  Rows3,
  ScanSearch,
  Calendar,
  GitCompare,
  Trophy,
  LifeBuoy,
  Sparkles,
} from "lucide-react";
import {
  WORKSPACE_NAV_GROUPS,
  isWorkspaceNavItemActive,
  type DashboardNavIcon,
} from "@/lib/dashboard/nav";
import { WorkspaceSidebarFooter } from "@/components/dashboard/WorkspaceSidebarFooter";
import { DmUnreadBadge } from "@/components/messages/DmUnreadBadge";
import { NotificationUnreadBadge } from "@/components/notifications/NotificationUnreadBadge";
import { FeedNewBadge } from "@/components/feed/FeedNewBadge";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/seo/site";

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
  dmUnread = 0,
  notifUnread = 0,
  feedNewCount = 0,
}: {
  username: string;
  dmUnread?: number;
  notifUnread?: number;
  feedNewCount?: number;
  whatsNewUnread?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="pf-workspace-sidebar grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto]">
      <div className="pf-sidebar-brand shrink-0 border-b border-[var(--pf-border)]">
        <Link href="/dashboard" className="block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Workspace
          </p>
          <p className="mt-0.5 text-[0.9375rem] font-bold leading-tight text-[var(--foreground)]">
            {SITE_NAME}
          </p>
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
                      {item.href === "/dashboard/feed" ? (
                        <FeedNewBadge initial={feedNewCount} />
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

      <WorkspaceSidebarFooter />
    </aside>
  );
}
