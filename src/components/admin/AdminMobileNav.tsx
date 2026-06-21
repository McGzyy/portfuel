"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import {
  ADMIN_TAB_GROUPS,
  ADMIN_TABS,
  adminTabHref,
  parseAdminTab,
  type AdminTab,
} from "@/lib/admin/nav";
import { AdminNavBadge } from "@/components/admin/AdminNavBadge";
import { useAdminNavCounts } from "@/components/admin/AdminNavCountsProvider";

function tabBadgeCount(
  tab: AdminTab,
  counts: { discoveryActionable: number; supportAttention: number }
) {
  if (tab === "discovery") return counts.discoveryActionable;
  if (tab === "support") return counts.supportAttention;
  return 0;
}

/** Mobile admin section picker — desktop uses fixed sidebar. */
export function AdminMobileNav() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = parseAdminTab(searchParams.get("tab"));
  const { counts } = useAdminNavCounts();
  const activeMeta = ADMIN_TABS.find((t) => t.id === tab);
  const badge = activeMeta ? tabBadgeCount(activeMeta.id, counts) : 0;

  return (
    <div className="border-b border-[var(--pf-border)] bg-white px-4 py-3 lg:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]">
            Administration
          </p>
          <p className="truncate text-sm font-bold text-[var(--pf-black)]">
            {activeMeta?.label ?? "Admin"}
            {badge > 0 ? (
              <span className="ml-1.5 inline-flex align-middle">
                <AdminNavBadge count={badge} />
              </span>
            ) : null}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--pf-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]"
        >
          <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2.25} />
          Workspace
        </Link>
      </div>
      <label htmlFor="admin-section-picker" className="sr-only">
        Admin section
      </label>
      <div className="relative">
        <select
          id="admin-section-picker"
          value={tab}
          onChange={(e) => router.push(adminTabHref(e.target.value as AdminTab))}
          className="w-full appearance-none rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] py-2.5 pl-3 pr-10 text-sm font-semibold text-[var(--foreground)] shadow-[var(--pf-shadow-sm)] outline-none focus:border-[var(--pf-gray-300)]"
        >
          {ADMIN_TAB_GROUPS.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {ADMIN_TABS.filter((t) => t.group === group.id).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {tabBadgeCount(item.id, counts) > 0
                    ? ` (${tabBadgeCount(item.id, counts)})`
                    : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pf-gray-400)]"
          aria-hidden
        />
      </div>
    </div>
  );
}
