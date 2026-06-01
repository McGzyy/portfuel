"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Flame,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Plus,
  Rows3,
  ScanSearch,
  GitCompare,
  Shield,
  Trophy,
  X,
} from "lucide-react";
import { COPY } from "@/lib/copy";
import {
  DASHBOARD_NAV,
  WORKSPACE_NAV_GROUPS,
  type DashboardNavIcon,
} from "@/lib/dashboard/nav";
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
  username,
  displayName,
  isAdmin = false,
}: {
  dmUnread?: number;
  username: string;
  displayName: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current =
    DASHBOARD_NAV.find((item) => isNavActive(pathname, item.href, item.exact)) ??
    DASHBOARD_NAV[0];

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
      <div className="flex items-center gap-2 border-b border-[var(--pf-border)] bg-white px-3 py-2 lg:hidden">
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
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--pf-black)]">
          {current.label}
        </p>
        <Link
          href="/dashboard/messages"
          className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--pf-border)] text-[var(--pf-gray-600)]"
          aria-label="Messages"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2} />
          <DmUnreadBadge
            initial={dmUnread}
            className="absolute -right-0.5 -top-0.5 min-w-[1rem] px-1"
          />
        </Link>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
          aria-label="Close workspace menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="workspace-mobile-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[min(18.5rem,88vw)] flex-col border-r border-[var(--pf-border)] bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden",
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

        {isAdmin ? (
          <div className="border-b border-[var(--pf-border)] px-4 py-2">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--pf-red-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pf-red)]"
            >
              <Shield className="h-3 w-3" strokeWidth={2.5} />
              Admin
            </Link>
          </div>
        ) : null}

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
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {COPY.newCall}
          </Link>
          <div className="flex items-center justify-between gap-2 px-1">
            <WorkspaceGuide />
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[var(--pf-gray-500)]"
            >
              Profile
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
