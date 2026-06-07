"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LayoutDashboard, Rows3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/demo", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/demo/feed", label: "Feed", icon: Rows3 },
  { href: "/demo/desk", label: "Desk", icon: Flame },
  { href: "/demo/rankings", label: "Rankings", icon: Trophy },
] as const;

export function DemoWorkspaceBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pf-workspace-bottom-nav lg:hidden" aria-label="Demo workspace">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active =
          "exact" in tab && tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "pf-workspace-bottom-nav-item",
              active && "pf-workspace-bottom-nav-item-active"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
