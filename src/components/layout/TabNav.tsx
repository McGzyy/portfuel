import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabItem = {
  href: string;
  label: string;
  active: boolean;
};

export function TabNav({ tabs, className }: { tabs: TabItem[]; className?: string }) {
  return (
    <nav
      className={cn(
        "inline-flex rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-surface)] p-1 shadow-[var(--pf-shadow-sm)] pf-tab-shell",
        className
      )}
      aria-label="Tabs"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
            tab.active
              ? "pf-pill-active rounded-md px-4 py-2 text-sm font-semibold shadow-sm"
              : "rounded-md px-4 py-2 text-sm font-semibold text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-50)] hover:text-[var(--foreground)]"
          )}
          aria-current={tab.active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
