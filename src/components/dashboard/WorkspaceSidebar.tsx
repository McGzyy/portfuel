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
  Notebook,
  Trophy,
  LifeBuoy,
  Sparkles,
} from "lucide-react";
import { WhatsNewBadge } from "@/components/announcements/WhatsNewBadge";
import { WORKSPACE_NAV_GROUPS, type DashboardNavIcon } from "@/lib/dashboard/nav";
import { WorkspaceSidebarFooter } from "@/components/dashboard/WorkspaceSidebarFooter";
import { DmUnreadBadge } from "@/components/messages/DmUnreadBadge";
import { NotificationUnreadBadge } from "@/components/notifications/NotificationUnreadBadge";
import { MemberAvatar } from "@/components/member/MemberAvatar";
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
  notebook: Notebook,
  help: LifeBuoy,
  sparkles: Sparkles,
};

export function WorkspaceSidebar({
  username,
  displayName,
  isAdmin,
  dmUnread = 0,
  notifUnread = 0,
  whatsNewUnread = 0,
}: {
  username: string;
  displayName: string;
  isAdmin?: boolean;
  dmUnread?: number;
  notifUnread?: number;
  whatsNewUnread?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="pf-workspace-sidebar flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-[var(--pf-border)] px-4 py-4">
        <Link href={`/member/${username}`} className="flex items-center gap-3">
          <MemberAvatar displayName={displayName} username={username} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--foreground)]">{displayName}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--pf-gray-500)]">
              @{username}
            </p>
          </div>
        </Link>
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
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate">{item.label}</span>
                      {item.href === "/dashboard/messages" ? (
                        <DmUnreadBadge initial={dmUnread} />
                      ) : null}
                      {item.href === "/dashboard/notifications" ? (
                        <NotificationUnreadBadge initial={notifUnread} />
                      ) : null}
                      {item.href === "/dashboard/whats-new" ? (
                        <WhatsNewBadge count={whatsNewUnread} />
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <WorkspaceSidebarFooter username={username} isAdmin={isAdmin} />
    </aside>
  );
}
