import type { Metadata } from "next";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { TickerLookupBar } from "@/components/dashboard/TickerLookupBar";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default async function DashboardWatchlistPage() {
  await requireDashboardSession();

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
        <WatchlistPanel demoMode={isDemoMode()} />
      </div>
    </>
  );
}
