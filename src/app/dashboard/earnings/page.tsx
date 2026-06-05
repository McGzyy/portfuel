import type { Metadata } from "next";
import { EarningsBattleboardCommandHeader } from "@/components/pro/EarningsBattleboardCommandHeader";
import { EarningsSurfacesExplainer } from "@/components/pro/EarningsSurfacesExplainer";
import { EarningsBattleboardLegend } from "@/components/pro/EarningsBattleboardLegend";
import { EarningsBattleboardTable } from "@/components/pro/EarningsBattleboardTable";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { WorkspaceQuickActions } from "@/components/dashboard/WorkspaceQuickActions";
import { ProMembershipStrip } from "@/components/dashboard/ProMembershipStrip";
import {
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import { requireDashboardSession } from "@/lib/dashboard/data";
import {
  fetchEarningsBattleboard,
  summarizeBattleboard,
} from "@/lib/earnings/battleboard";

export const metadata: Metadata = {
  title: "Earnings",
};

export default async function DashboardEarningsPage() {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);
  const rows = await fetchEarningsBattleboard();
  const summary = summarizeBattleboard(rows);

  return (
    <div className="space-y-6">
      <EarningsBattleboardCommandHeader summary={summary} />

      <WorkspaceQuickActions proUnlocked={!proLocked} />

      <EarningsSurfacesExplainer />

      {proLocked ? <ProMembershipStrip locked /> : null}

      <ProIntelligenceGate
        locked={proLocked}
        cta={proGateCta}
        title="Earnings"
        description="Market-wide reporting week plus how PortFuel members and the Fueled desk are positioned before each report."
      >
        <div className="space-y-4">
          <EarningsBattleboardLegend />
          <EarningsBattleboardTable rows={rows} />
        </div>
      </ProIntelligenceGate>
    </div>
  );
}
