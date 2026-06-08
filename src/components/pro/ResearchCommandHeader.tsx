import Link from "next/link";
import { ResearchHubTabs } from "@/components/pro/ResearchHubTabs";
import {
  RESEARCH_HUB_TABS,
  type ResearchHubTab,
} from "@/lib/dashboard/research-hub";

export function ResearchCommandHeader({
  tab,
  detail,
}: {
  tab: ResearchHubTab;
  detail?: string;
}) {
  const activeTab = RESEARCH_HUB_TABS.find((t) => t.id === tab) ?? RESEARCH_HUB_TABS[0]!;

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Pro Intelligence · Research hub
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
          {activeTab.label}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
          {detail ?? activeTab.description}
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
        >
          ← Workspace overview
        </Link>
        <ResearchHubTabs active={tab} />
      </div>
    </header>
  );
}
