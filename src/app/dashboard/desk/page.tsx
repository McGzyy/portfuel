import { CallCard } from "@/components/calls/CallCard";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { loadFeedCalls, mapCallForCard } from "@/lib/dashboard/data";

export default async function DashboardDeskPage() {
  const latest = await loadFeedCalls("latest");
  const performing = await loadFeedCalls("performing");
  const fueledLatest = latest.filter((c) => c.is_fueled).map(mapCallForCard);
  const fueledPerforming = performing.filter((c) => c.is_fueled).map(mapCallForCard);

  return (
    <>
      <WorkspacePageHeader
        title="Fueled desk"
        description="Official PortFuel research — curated desk theses, clearly separated from the member feed."
      />

      <section className="pf-fueled-desk p-6 sm:p-8">
        <p className="pf-eyebrow">PortFuel research</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
          These calls are published by the PortFuel desk. They carry the Fueled badge and represent
          institutional-quality theses for the community.
        </p>
      </section>

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
            {fueledLatest.map((call) => (
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
