import type { Metadata } from "next";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { ProCommunityScreener } from "@/components/pro/ProCommunityScreener";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchCommunityScreener } from "@/lib/screener/community";

export const metadata: Metadata = {
  title: "Community screener",
};

export default async function DashboardScreenerPage() {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);
  const data = await fetchCommunityScreener();

  return (
    <>
      <WorkspacePageHeader
        eyebrow="Pro Intelligence"
        title="Community screener"
        description="Where conviction is clustering this week and which member theses are leading on returns — built from PortFuel call data, not generic market screens."
      />

      <div className="mt-8">
        <ProCommunityScreener
          data={data}
          locked={proLocked}
          proGateCta={proGateCta}
          showExport
        />
      </div>
    </>
  );
}
