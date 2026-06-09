"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  ADMIN_TAB_GROUPS,
  ADMIN_TABS,
  adminTabHref,
  parseAdminTab,
  type AdminTab,
} from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = parseAdminTab(searchParams.get("tab"));
  const activeMeta = ADMIN_TABS.find((t) => t.id === tab);

  return (
    <>
      <div className="lg:hidden">
        <label
          htmlFor="admin-section-picker"
          className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]"
        >
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
        {activeMeta ? (
          <p className="mt-2 text-xs text-[var(--pf-gray-500)]">{activeMeta.label}</p>
        ) : null}
      </div>

      <nav className="hidden lg:block" aria-label="Admin sections">
        <div className="sticky top-4 space-y-5">
          {ADMIN_TAB_GROUPS.map((group) => {
            const items = ADMIN_TABS.filter((t) => t.group === group.id);
            return (
              <div key={group.id}>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--pf-gray-400)]">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const isActive = tab === item.id;
                    return (
                      <li key={item.id}>
                        <Link
                          href={adminTabHref(item.id)}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                            isActive
                              ? "pf-pill-active"
                              : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-50)] hover:text-[var(--pf-black)]"
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
