import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CallCard } from "@/components/calls/CallCard";
import { Button } from "@/components/ui/button";
import { loadFeedCalls, mapCallForCard } from "@/lib/dashboard/data";

export default async function DashboardDeskPage() {
  const latest = await loadFeedCalls("latest");
  const performing = await loadFeedCalls("performing");
  const fueledLatest = latest.filter((c) => c.is_fueled).map(mapCallForCard);
  const fueledPerforming = performing.filter((c) => c.is_fueled).map(mapCallForCard);

  return (
    <>
      <PageHeader
        title="Fueled desk"
        description="Official PortFuel theses — curated by the desk, separate from the member feed. These appear with the Fueled badge across the platform."
        action={
          <Link href="/calls/new">
            <Button variant="secondary">
              <Plus className="h-4 w-4" />
              Member call
            </Button>
          </Link>
        }
      />

      <section className="mt-8">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Latest desk calls
        </h2>
        {fueledLatest.length === 0 ? (
          <p className="pf-empty mt-4">No Fueled calls published yet.</p>
        ) : (
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {fueledLatest.map((call) => (
              <li key={call.id}>
                <CallCard call={call} interactive />
              </li>
            ))}
          </ul>
        )}
      </section>

      {fueledPerforming.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Top performers (30 days)
          </h2>
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {fueledPerforming.map((call) => (
              <li key={call.id}>
                <CallCard call={call} interactive />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
