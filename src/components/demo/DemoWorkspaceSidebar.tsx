"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LayoutDashboard, Rows3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/demo", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/demo/feed", label: "Member feed", icon: Rows3 },
  { href: "/demo/desk", label: "Fueled desk", icon: Flame },
  { href: "/demo/rankings", label: "Rankings", icon: Trophy },
] as const;

export function DemoWorkspaceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="pf-workspace-sidebar flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-[var(--pf-border)] px-4 py-4">
        <p className="text-sm font-bold text-[var(--pf-black)]">Workspace preview</p>
        <p className="mt-0.5 text-[11px] text-[var(--pf-gray-500)]">
          Sample book & watchlist — feed & desk gated
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3" aria-label="Demo workspace">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--pf-black)] text-white"
                  : "text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-black)]"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[var(--pf-red)]" : "text-[var(--pf-gray-400)]"
                )}
                strokeWidth={2.25}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-[var(--pf-border)] p-3">
        <Link
          href="/join"
          className="flex w-full items-center justify-center rounded-lg bg-[var(--pf-red)] px-3 py-2.5 text-xs font-bold text-white hover:bg-[var(--pf-red-hover)]"
        >
          Get member access
        </Link>
      </div>
    </aside>
  );
}
