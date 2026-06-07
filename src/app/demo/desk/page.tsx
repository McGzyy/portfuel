import Link from "next/link";
import { CallCard } from "@/components/calls/CallCard";
import { DemoPreviewSourceSync } from "@/components/demo/DemoPreviewSourceSync";
import { DeskPortfolioPanel } from "@/components/desk/DeskPortfolioPanel";
import { DeskPortfolioChart } from "@/components/charts/DeskPortfolioChart";
import { FueledDeskBrief } from "@/components/dashboard/FueledDeskBrief";
import { FueledTrackRecordPanel } from "@/components/dashboard/FueledTrackRecordPanel";
import { buildDeskPortfolioCurve } from "@/lib/charts/desk-portfolio-curve";
import {
  loadPreviewDeskBrief,
  loadPreviewDeskPortfolio,
  loadPreviewFeedCalls,
  loadPreviewFueledTrackRecord,
  mapPreviewCallsForCards,
} from "@/lib/demo/workspace-preview";

export default async function DemoDeskPage() {
  const [
    { brief: deskBrief, source: briefSource },
    { portfolio, source: portfolioSource },
    { record: fueledTrackRecord },
    { calls: latestRaw },
  ] = await Promise.all([
    loadPreviewDeskBrief(),
    loadPreviewDeskPortfolio(),
    loadPreviewFueledTrackRecord(),
    loadPreviewFeedCalls("latest"),
  ]);

  const source = briefSource === "live" || portfolioSource === "live" ? "live" : "sample";
  const latestCalls = await mapPreviewCallsForCards(latestRaw);
  const fueledLatest = latestCalls.filter((c) => c.is_fueled);
  const fueledPerforming = [...fueledLatest]
    .filter((c) => (c.return_pct ?? 0) > 0)
    .sort((a, b) => (b.return_pct ?? 0) - (a.return_pct ?? 0));
  const portfolioCurve = buildDeskPortfolioCurve(portfolio);
  const openPositions = portfolio.filter((e) => e.status === "open").length;

  return (
    <div className="space-y-6">
      <DemoPreviewSourceSync source={source} />

      <header className="pf-workspace-panel px-5 py-6 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Fueled desk
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--pf-black)]">
          House research
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pf-gray-600)]">
          Curated PortFuel theses, model portfolio, and weekly desk notes — the lane members follow
          for house IP.
        </p>
        {openPositions > 0 ? (
          <p className="mt-3 text-xs font-medium text-[var(--pf-gray-500)]">
            {openPositions} open model position{openPositions === 1 ? "" : "s"} on desk
          </p>
        ) : null}
      </header>

      <FueledDeskBrief brief={deskBrief} />

      <FueledTrackRecordPanel record={fueledTrackRecord} />

      {portfolio.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <DeskPortfolioChart points={portfolioCurve} />
          <DeskPortfolioPanel entries={portfolio} deskHref="/demo/desk" />
        </div>
      ) : null}

      {fueledLatest.length > 0 ? (
        <section className="pf-workspace-panel p-5 sm:p-6">
          <h2 className="text-sm font-bold text-[var(--pf-black)]">Latest desk calls</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {fueledLatest.slice(0, 4).map((call) => (
              <CallCard key={call.id} call={call} showSummary />
            ))}
          </div>
        </section>
      ) : null}

      {fueledPerforming.length > 0 ? (
        <section className="pf-workspace-panel p-5 sm:p-6">
          <h2 className="text-sm font-bold text-[var(--pf-black)]">Top performing desk calls</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {fueledPerforming.slice(0, 4).map((call) => (
              <CallCard key={call.id} call={call} showSummary />
            ))}
          </div>
        </section>
      ) : null}

      <div className="rounded-xl border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-5 py-4 text-center text-sm text-[var(--pf-gray-600)]">
        Want the full desk workflow, notifications, and watchlist sync?{" "}
        <Link href="/join" className="font-semibold text-[var(--pf-red)]">
          Join PortFuel
        </Link>
      </div>
    </div>
  );
}
