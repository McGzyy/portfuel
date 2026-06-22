import type { Metadata } from "next";
import Link from "next/link";
import { CallCard } from "@/components/calls/CallCard";
import { FueledDeskBrief } from "@/components/dashboard/FueledDeskBrief";
import { DeskPortfolioPanel } from "@/components/desk/DeskPortfolioPanel";
import { DeskPortfolioChart } from "@/components/charts/DeskPortfolioChart";
import { buildDeskPortfolioCurve } from "@/lib/charts/desk-portfolio-curve";
import { DeskPortfolioWatchlistButton } from "@/components/desk/DeskPortfolioWatchlistButton";
import { DeskContextRail } from "@/components/desk/DeskContextRail";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import { FueledDeskCommandHeader } from "@/components/dashboard/FueledDeskCommandHeader";
import { ChecklistVisitMarker } from "@/components/dashboard/ChecklistVisitMarker";
import { CHECKLIST_DESK_VISITED_KEY } from "@/lib/onboarding/workspace-checklist";
import { Button } from "@/components/ui/button";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { fetchDeskBrief } from "@/lib/desk/brief";
import { fetchDeskPortfolio } from "@/lib/desk/portfolio";
import { loadFeedCalls, mapCallForCard, requireDashboardSession } from "@/lib/dashboard/data";
import { fetchDiscoveryOriginCallIds } from "@/lib/desk-discovery/call-origin";
import { fetchFueledTrackRecord } from "@/lib/fueled/track-record";
import { FueledTrackRecordPanel } from "@/components/dashboard/FueledTrackRecordPanel";
import { fetchLatestSnapshotUpdatedAt } from "@/lib/market/quote-freshness";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Fueled desk",
};

export default async function DashboardDeskPage() {
  const session = await requireDashboardSession();
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));

  const [deskBrief, portfolio, latest, performing, fueledTrackRecord] = await Promise.all([
    fetchDeskBrief(),
    fetchDeskPortfolio(),
    loadFeedCalls("latest"),
    loadFeedCalls("performing"),
    fetchFueledTrackRecord(),
  ]);
  const portfolioCurve = buildDeskPortfolioCurve(portfolio);
  const hypeScores = await fetchHypeScoresBySymbols([
    ...latest.map((c) => c.symbol),
    ...performing.map((c) => c.symbol),
  ]);
  const discoveryCallIds = await fetchDiscoveryOriginCallIds([
    ...latest.map((c) => c.id),
    ...performing.map((c) => c.id),
  ]);
  const fueledLatest = latest
    .filter((c) => c.is_fueled)
    .map((c) => mapCallForCard(c, hypeScores, discoveryCallIds));
  const fueledPerforming = performing
    .filter((c) => c.is_fueled)
    .map((c) => mapCallForCard(c, hypeScores, discoveryCallIds));

  const openPositions = portfolio.filter((e) => e.status === "open").length;
  const quoteSymbols = [
    ...portfolio.filter((e) => e.status === "open").map((e) => e.symbol),
    ...fueledLatest.map((c) => c.symbol ?? "").filter(Boolean),
  ];
  const quotesUpdatedAt = await fetchLatestSnapshotUpdatedAt(quoteSymbols);

  const totalDeskCalls = fueledLatest.length + fueledPerforming.length;

  return (
    <WorkspaceContextShell
      pulseLabel="Desk intel"
      rail={
        <DeskContextRail
          openPositions={openPositions}
          totalDeskCalls={totalDeskCalls}
          trackRecord={fueledTrackRecord}
          pinnedSymbol={deskBrief.pinnedCall?.symbol ?? null}
          hasWeeklyNote={Boolean(deskBrief.weeklyNote)}
          isAdmin={session.role === "admin"}
        />
      }
      mainClassName="space-y-6 pb-14 lg:pb-0"
    >
      <ChecklistVisitMarker storageKey={CHECKLIST_DESK_VISITED_KEY} />

      <FueledDeskCommandHeader
        weeklyNote={deskBrief.weeklyNote}
        openPositions={openPositions}
        totalDeskCalls={totalDeskCalls}
        quotesUpdatedAt={quotesUpdatedAt}
        isPro={!proLocked}
      />

      <FueledDeskBrief brief={deskBrief} />

      <FueledTrackRecordPanel record={fueledTrackRecord} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DeskPortfolioChart points={portfolioCurve} />
        <div>
          <DeskPortfolioPanel entries={portfolio} />
          <DeskPortfolioWatchlistButton
            openCount={portfolio.filter((e) => e.status === "open").length}
          />
        </div>
      </div>

      {!deskBrief.weeklyNote && !deskBrief.pinnedCall ? (
        <section className="pf-workspace-panel mt-6 px-5 py-6">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            PortFuel research
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--pf-gray-600)]">
            Desk theses carry the Fueled badge and are separate from the member feed. Admins publish
            the weekly note and pinned call in Admin → Desk.
          </p>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Latest
        </h2>
        {fueledLatest.length === 0 ? (
          <div className="pf-workspace-panel px-6 py-12 text-center text-sm text-[var(--pf-gray-500)]">
            <p>No desk calls yet.</p>
            {session.role === "admin" ? (
              <Link href="/admin?tab=desk" className="mt-4 inline-block">
                <Button size="sm">Publish first Fueled call</Button>
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {fueledLatest
              .filter((call) => call.id !== deskBrief.pinnedCall?.id)
              .map((call) => (
                <CallCard
                  key={call.id}
                  call={call}
                  interactive
                  canGenerateSummary={!proLocked}
                  showUpgrade={proLocked}
                />
              ))}
          </div>
        )}
      </section>

      {fueledPerforming.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Top performers · 30 days
          </h2>
          <div className="space-y-4">
            {fueledPerforming.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                interactive
                canGenerateSummary={!proLocked}
                showUpgrade={proLocked}
              />
            ))}
          </div>
        </section>
      ) : null}
    </WorkspaceContextShell>
  );
}
