"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Flame,
  LayoutDashboard,
  Bell,
  Menu,
  MessageCircle,
  Megaphone,
  Notebook,
  Rows3,
  ScanSearch,
  Calendar,
  GitCompare,
  Trophy,
  X,
} from "lucide-react";
import { COPY } from "@/lib/copy";
import {
  WORKSPACE_BOTTOM_NAV,
  WORKSPACE_MORE_PATH_PREFIXES,
} from "@/lib/dashboard/quick-actions";
import { WORKSPACE_NAV_GROUPS, type DashboardNavIcon } from "@/lib/dashboard/nav";
import { WorkspaceGuideTrigger } from "@/components/dashboard/WorkspaceGuideTrigger";
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

function isNavActive(pathname: string, href: string, exact?: boolean) {
  return exact === true
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function isMoreActive(pathname: string): boolean {
  return WORKSPACE_MORE_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Mobile workspace nav — fixed bottom tabs + More drawer (desktop uses sidebar). */
export function MemberNav({
  dmUnread = 0,
  notifUnread = 0,
  username,
  displayName,
  isAdmin = false,
}: {
  dmUnread?: number;
  notifUnread?: number;
  username: string;
  displayName: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const moreUnread = dmUnread + notifUnread;

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const moreActive = isMoreActive(pathname);

  return (
    <>
      {drawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 top-[var(--pf-safe-top)] z-[60] bg-black/40 lg:hidden"
          aria-label="Close workspace menu"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        id="workspace-mobile-nav"
        className={cn(
          "fixed bottom-0 left-0 top-[var(--pf-safe-top)] z-[70] grid w-[min(18.5rem,88vw)] grid-rows-[auto_minmax(0,1fr)_auto] border-r border-[var(--pf-border)] bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
        inert={drawerOpen ? undefined : true}
      >
        <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--pf-black)]">{displayName}</p>
            <p className="truncate font-mono text-[11px] text-[var(--pf-gray-500)]">@{username}</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3" aria-label="Workspace">
          {WORKSPACE_NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICONS[item.icon];
                  const active = isNavActive(pathname, item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "bg-[var(--pf-black)] text-white"
                          : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)]"
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

        <div className="space-y-2 border-t border-[var(--pf-border)] p-3 pb-[var(--pf-drawer-footer-pad)]">
          <Link
            href={COPY.newCallHref}
            onClick={() => setDrawerOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--pf-red)] px-3 py-2.5 text-sm font-semibold text-white"
          >
            <Megaphone className="h-4 w-4" strokeWidth={2.25} />
            {COPY.publishCallCta}
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
            <WorkspaceGuideTrigger onOpen={() => setDrawerOpen(false)} />
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href={`/member/${username}`}
                onClick={() => setDrawerOpen(false)}
                className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
              >
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setDrawerOpen(false)}
                className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <nav
        className={cn(
          "pf-workspace-bottom-nav lg:hidden",
          drawerOpen && "z-[80]"
        )}
        aria-label="Primary workspace navigation"
      >
        {WORKSPACE_BOTTOM_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isNavActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "pf-workspace-bottom-nav-item",
                active && "pf-workspace-bottom-nav-item-active"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="workspace-mobile-nav"
          className={cn(
            "pf-workspace-bottom-nav-item",
            (moreActive || drawerOpen) && "pf-workspace-bottom-nav-item-active"
          )}
        >
          <span className="relative">
            <Menu className="h-5 w-5 shrink-0" strokeWidth={moreActive || drawerOpen ? 2.5 : 2} />
            {moreUnread > 0 ? (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--pf-red)] ring-2 ring-white" />
            ) : null}
          </span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
