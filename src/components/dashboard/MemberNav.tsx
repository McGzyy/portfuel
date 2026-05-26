"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV } from "@/lib/dashboard/nav";
import { DmUnreadBadge } from "@/components/messages/DmUnreadBadge";
import { cn } from "@/lib/utils";

/** Compact horizontal nav — mobile / tablet only; desktop uses WorkspaceSidebar */
export function MemberNav({ dmUnread = 0 }: { dmUnread?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Workspace"
    >
      {DASHBOARD_NAV.map((item) => {
        const active =
          item.exact === true
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-[var(--pf-black)] text-white"
                : "bg-[var(--pf-gray-100)] text-[var(--pf-gray-600)]"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {item.label}
              {item.href === "/dashboard/messages" ? (
                <DmUnreadBadge initial={dmUnread} className="min-w-[1rem] px-1" />
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
