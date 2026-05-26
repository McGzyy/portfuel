import type { Metadata } from "next";
import { CallCard } from "@/components/calls/CallCard";
import { FueledDeskBrief } from "@/components/dashboard/FueledDeskBrief";
import { DeskPortfolioPanel } from "@/components/desk/DeskPortfolioPanel";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";
import { fetchDeskBrief } from "@/lib/desk/brief";
import { fetchDeskPortfolio } from "@/lib/desk/portfolio";
import { loadFeedCalls, mapCallForCard } from "@/lib/dashboard/data";

export const metadata: Metadata = {
  title: "Fueled desk",
};

export default async function DashboardDeskPage() {
  const deskBrief = await fetchDeskBrief();
  const portfolio = await fetchDeskPortfolio();
  const latest = await loadFeedCalls("latest");
  const performing = await loadFeedCalls("performing");
  const hypeScores = await fetchHypeScoresBySymbols([
    ...latest.map((c) => c.symbol),
    ...performing.map((c) => c.symbol),
  ]);
  const fueledLatest = latest.filter((c) => c.is_fueled).map((c) => mapCallForCard(c, hypeScores));
  const fueledPerforming = performing
    .filter((c) => c.is_fueled)
    .map((c) => mapCallForCard(c, hypeScores));

  return (
    <>
      <WorkspacePageHeader
        eyebrow="PortFuel research"
        title="Fueled desk"
        description="Official PortFuel research — curated desk theses, clearly separated from the member feed."
      />

      <FueledDeskBrief brief={deskBrief} />

      <div className="mt-6">
        <DeskPortfolioPanel entries={portfolio} />
      </div>

      {!deskBrief.weeklyNote && !deskBrief.pinnedCall ? (
        <section className="pf-fueled-desk mt-6 p-6 sm:p-8">
          <p className="pf-eyebrow">PortFuel research</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            These calls are published by the PortFuel desk. They carry the Fueled badge and
            represent institutional-quality theses for the community.
          </p>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Latest
        </h2>
        {fueledLatest.length === 0 ? (
          <div className="pf-workspace-panel py-12 text-center text-sm text-[var(--pf-gray-500)]">
            No desk calls yet.
          </div>
        ) : (
          <div className="space-y-4">
            {fueledLatest
              .filter((call) => call.id !== deskBrief.pinnedCall?.id)
              .map((call) => (
                <CallCard key={call.id} call={call} interactive />
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
              <CallCard key={call.id} call={call} interactive />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
