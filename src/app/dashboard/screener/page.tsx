import type { Metadata } from "next";
import { ScreenerCommandHeader } from "@/components/pro/ScreenerCommandHeader";
import { ProCommunityScreener } from "@/components/pro/ProCommunityScreener";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { fetchCommunityScreener } from "@/lib/screener/community";
import { buildCompareHref } from "@/lib/dashboard/compare-symbols";

export const metadata: Metadata = {
  title: "Community screener",
};

export default async function DashboardScreenerPage() {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);
  const data = await fetchCommunityScreener();

  const compareSymbols = [
    data.mostCalled[0]?.symbol,
    data.topReturns[0]?.symbol,
  ].filter((s): s is string => Boolean(s));
  const compareHref = buildCompareHref(compareSymbols);

  return (
    <div className="space-y-6">
      <ScreenerCommandHeader data={data} />

      <WorkspaceQuickActions compact proUnlocked={!proLocked} />

      {proLocked ? <ProMembershipStrip locked /> : null}

      {!proLocked && compareSymbols.length >= 2 ? (
        <p className="text-xs text-[var(--pf-gray-500)]">
          <a href={compareHref} className="font-semibold text-[var(--pf-red)] hover:underline">
            Compare {compareSymbols.join(" vs ")} →
          </a>
        </p>
      ) : null}

      <ProCommunityScreener
        data={data}
        locked={proLocked}
        proGateCta={proGateCta}
        showExport
      />
    </div>
  );
}
