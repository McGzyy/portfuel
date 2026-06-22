import Link from "next/link";
import { ResearchHubTabs } from "@/components/pro/ResearchHubTabs";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
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
    <div className="space-y-4">
      <WorkspacePageHeader
        eyebrow="Pro Intelligence · Research hub"
        title={activeTab.label}
        description={detail ?? activeTab.description}
        footerLink={
          <Link
            href="/dashboard"
            className="inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            ← Workspace overview
          </Link>
        }
      />
      <ResearchHubTabs active={tab} />
    </div>
  );
}
