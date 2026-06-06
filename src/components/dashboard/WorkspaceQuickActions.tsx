"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  Calendar,
  Flame,
  GitCompare,
  LayoutDashboard,
  MessageCircle,
  Notebook,
  Rows3,
  ScanSearch,
  Trophy,
} from "lucide-react";
import { PRO_NAV_RAIL, WORKSPACE_NAV_RAIL } from "@/lib/dashboard/quick-actions";
import type { DashboardNavIcon } from "@/lib/dashboard/nav";
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
  notebook: Notebook,
};

function isNavActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact === true
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function RailLink({
  href,
  label,
  icon,
  exact,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: DashboardNavIcon;
  exact?: boolean;
  badge?: "notifications" | "messages";
  active: boolean;
}) {
  const Icon = ICONS[icon];

  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "pf-workspace-rail-link",
        active && "pf-workspace-rail-link-active"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
      <span className="truncate">{label}</span>
      {badge === "notifications" ? (
        <NotificationUnreadBadge className="ml-0.5 shrink-0" />
      ) : null}
      {badge === "messages" ? <DmUnreadBadge className="ml-0.5 shrink-0" /> : null}
    </Link>
  );
}

export function WorkspaceQuickActions({
  proUnlocked = false,
}: {
  /** @deprecated compact/full merged — one rail layout everywhere */
  compact?: boolean;
  proUnlocked?: boolean;
}) {
  const pathname = usePathname();
  const proItems = proUnlocked ? PRO_NAV_RAIL : [];

  return (
    <nav className={cn("pf-workspace-rail lg:hidden")} aria-label="Workspace navigation">
      <div className="pf-workspace-rail-scroll">
        <div className="pf-workspace-rail-group">
          {WORKSPACE_NAV_RAIL.map((item) => (
            <RailLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
              badge={item.badge}
              active={isNavActive(pathname, item.href, item.exact)}
            />
          ))}
        </div>
        {proItems.length > 0 ? (
          <>
            <span className="pf-workspace-rail-sep" aria-hidden />
            <div className="pf-workspace-rail-group pf-workspace-rail-group-pro">
              <span className="pf-workspace-rail-pro-label">Pro</span>
              {proItems.map((item) => (
                <RailLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  exact={item.exact}
                  active={isNavActive(pathname, item.href, item.exact)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </nav>
  );
}
