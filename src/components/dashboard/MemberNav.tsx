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
  Rows3,
  ScanSearch,
  Calendar,
  GitCompare,
  Trophy,
  X,
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

function isNavActive(pathname: string, href: string, exact?: boolean) {
  return exact === true
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile / tablet workspace nav — menu button opens a drawer instead of horizontal scroll. */
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--pf-border)] bg-white px-3 py-2 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[var(--pf-black)]"
          aria-expanded={open}
          aria-controls="workspace-mobile-nav"
          aria-label="Open workspace menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2.25} />
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/dashboard/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--pf-border)] text-[var(--pf-gray-600)]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
            <NotificationUnreadBadge
              initial={notifUnread}
              className="absolute -right-0.5 -top-0.5 min-w-[1rem] px-1"
            />
          </Link>
          <Link
            href="/dashboard/messages"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--pf-border)] text-[var(--pf-gray-600)]"
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2} />
            <DmUnreadBadge
              initial={dmUnread}
              className="absolute -right-0.5 -top-0.5 min-w-[1rem] px-1"
            />
          </Link>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-[var(--pf-safe-top)] z-[60] bg-black/40 lg:hidden"
          aria-label="Close workspace menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="workspace-mobile-nav"
        className={cn(
          "fixed bottom-0 left-0 top-[var(--pf-safe-top)] z-[70] flex w-[min(18.5rem,88vw)] flex-col border-r border-[var(--pf-border)] bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!open}
        inert={open ? undefined : true}
      >
        <div className="flex items-center justify-between border-b border-[var(--pf-border)] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--pf-black)]">{displayName}</p>
            <p className="truncate font-mono text-[11px] text-[var(--pf-gray-500)]">@{username}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
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
                      onClick={() => setOpen(false)}
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

        <div className="shrink-0 space-y-2 border-t border-[var(--pf-border)] p-3">
          <Link
            href={COPY.newCallHref}
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--pf-red)] px-3 py-2.5 text-sm font-semibold text-white"
          >
            <Megaphone className="h-4 w-4" strokeWidth={2.25} />
            {COPY.newCall}
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
            <WorkspaceGuide username={username} />
            <div className="flex items-center gap-3">
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
                >
                  Administration
                </Link>
              ) : null}
              <Link
                href={`/member/${username}`}
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--pf-black)]"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
