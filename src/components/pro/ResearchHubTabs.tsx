"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RESEARCH_HUB_TABS,
  buildResearchHubHref,
  type ResearchHubTab,
} from "@/lib/dashboard/research-hub";
import { cn } from "@/lib/utils";

export function ResearchHubTabs({ active }: { active: ResearchHubTab }) {
  const pathname = usePathname();

  return (
    <nav
      className="mt-4 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Research hub sections"
    >
      {RESEARCH_HUB_TABS.map((tab) => {
        const href = buildResearchHubHref(tab.id);
        const isActive =
          pathname.startsWith("/dashboard/research") && active === tab.id;

        return (
          <Link
            key={tab.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? "pf-pill-active border"
                : "pf-pill-inactive border hover:border-[var(--pf-gray-300)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
