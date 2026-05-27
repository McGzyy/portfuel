import type { Metadata } from "next";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { TickerLookupBar } from "@/components/dashboard/TickerLookupBar";
import { WatchlistIntelHint } from "@/components/dashboard/WatchlistIntelHint";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { EarningsCalendarPanel } from "@/components/pro/EarningsCalendarPanel";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";
import {
  canAccessProIntelligence,
  getProGateCta,
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default async function DashboardWatchlistPage() {
  const session = await requireDashboardSession();
  const proContext = sessionToProContext(session);
  const proLocked = isProIntelligenceLocked(proContext);
  const proGateCta = getProGateCta(proContext);
  const proUnlocked = canAccessProIntelligence(proContext);

  return (
    <>
      <WorkspacePageHeader
        eyebrow="Market tracking"
        title="Watchlist"
        description="Track the symbols that matter to you. Look up any ticker for charts, community calls, and market intel."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TickerLookupBar />
      </div>

      <div className="mt-6">
        <WatchlistIntelHint />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <WatchlistPanel demoMode={isDemoMode()} proUnlocked={proUnlocked} />
        <EarningsCalendarPanel locked={proLocked} proGateCta={proGateCta} />
      </div>
    </>
  );
}
