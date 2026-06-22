"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  ChevronLeft,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  Radar,
  Rocket,
  Share2,
  Target,
  Ticket,
  UserMinus,
  Users,
} from "lucide-react";
import {
  ADMIN_TAB_GROUPS,
  ADMIN_TABS,
  adminTabHref,
  parseAdminTab,
  type AdminNavIcon,
  type AdminTab,
} from "@/lib/admin/nav";
import { AdminNavBadge } from "@/components/admin/AdminNavBadge";
import { useAdminNavCounts } from "@/components/admin/AdminNavCountsProvider";
import { SITE_NAME } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

const ICONS: Record<AdminNavIcon, typeof BarChart3> = {
  "bar-chart": BarChart3,
  users: Users,
  "life-buoy": LifeBuoy,
  "user-minus": UserMinus,
  ticket: Ticket,
  rocket: Rocket,
  megaphone: Megaphone,
  briefcase: Briefcase,
  radar: Radar,
  "share-2": Share2,
  "message-circle": MessageCircle,
  target: Target,
};

function tabBadgeCount(tab: AdminTab, counts: ReturnType<typeof useAdminNavCounts>["counts"]) {
  if (tab === "discovery") return counts.discoveryActionable;
  if (tab === "support") return counts.supportAttention;
  return 0;
}

export function AdminWorkspaceSidebar() {
  const searchParams = useSearchParams();
  const tab = parseAdminTab(searchParams.get("tab"));
  const { counts } = useAdminNavCounts();

  return (
    <aside className="pf-workspace-sidebar grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto]">
      <div className="pf-sidebar-brand shrink-0 border-b border-[var(--pf-border)]">
        <Link href="/admin" className="block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Administration
          </p>
          <p className="mt-0.5 text-[0.9375rem] font-bold leading-tight text-[var(--foreground)]">
            {SITE_NAME}
          </p>
        </Link>
      </div>

      <nav
        className="pf-sidebar-nav-scroll min-h-0 overflow-y-auto overscroll-contain px-3 py-2.5 lg:overflow-y-hidden"
        aria-label="Admin sections"
      >
        {ADMIN_TAB_GROUPS.map((group) => {
          const items = ADMIN_TABS.filter((t) => t.group === group.id);
          return (
            <div key={group.id} className="pf-sidebar-nav-group">
              <p className="pf-sidebar-nav-group-label">{group.label}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = ICONS[item.icon];
                  const isActive = tab === item.id;
                  const badge = tabBadgeCount(item.id, counts);

                  return (
                    <Link
                      key={item.id}
                      href={adminTabHref(item.id)}
                      className={cn(
                        "pf-sidebar-nav-item",
                        isActive
                          ? "pf-nav-link-active bg-[var(--pf-black)] text-white"
                          : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--foreground)]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-[var(--pf-red)]" : "text-[var(--pf-gray-400)]"
                        )}
                        strokeWidth={2.25}
                      />
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <span className="truncate">{item.label}</span>
                        <AdminNavBadge count={badge} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="pf-sidebar-footer shrink-0">
        <Link href="/dashboard" className="pf-sidebar-footer-cta hidden lg:flex">
          <LayoutDashboard className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          Back to workspace
        </Link>
        <Link href="/dashboard" className="pf-sidebar-footer-link lg:hidden">
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Back to workspace
        </Link>
      </div>
    </aside>
  );
}
