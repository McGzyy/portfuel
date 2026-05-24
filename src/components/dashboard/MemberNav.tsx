"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

export function MemberNav() {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-[var(--pf-border)] bg-white/80 backdrop-blur-sm"
      aria-label="Member workspace"
    >
      <div className="flex gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DASHBOARD_NAV.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "text-[var(--pf-black)]"
                  : "text-[var(--pf-gray-500)] hover:text-[var(--pf-gray-700)]"
              )}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[var(--pf-red)]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
