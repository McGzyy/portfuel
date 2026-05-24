import { PageHeader } from "@/components/layout/PageHeader";
import { TickerLookupBar } from "@/components/dashboard/TickerLookupBar";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { isDemoMode } from "@/lib/demo/config";

export default async function DashboardWatchlistPage() {
  await requireDashboardSession();
  const demoMode = isDemoMode();

  return (
    <>
      <PageHeader
        title="Watchlist"
        description="Track symbols you care about. Use ticker lookup to open any symbol’s chart, community calls, and market intel."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TickerLookupBar />
        <div className="lg:col-span-2">
          <WatchlistPanel demoMode={demoMode} />
        </div>
      </div>
    </>
  );
}
