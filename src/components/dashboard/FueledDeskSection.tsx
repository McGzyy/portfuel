import Link from "next/link";
import { CallCard } from "@/components/calls/CallCard";
import type { CallCardData } from "@/components/calls/CallCard";

export function FueledDeskSection({
  calls,
  viewerUserId,
  isAdmin = false,
  deskHref = "/dashboard/desk",
  readOnly = false,
}: {
  calls: CallCardData[];
  viewerUserId?: string;
  isAdmin?: boolean;
  deskHref?: string;
  readOnly?: boolean;
}) {
  if (calls.length === 0) return null;

  return (
    <section className="pf-fueled-desk p-5 sm:p-6" aria-label="PortFuel Fueled desk">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="pf-eyebrow">PortFuel Fueled</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Desk calls</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Official PortFuel theses — curated by the desk, separate from member flow.
          </p>
        </div>
        <Link
          href={deskHref}
          className="text-xs font-semibold text-red-300 hover:text-red-200 hover:underline"
        >
          Open Fueled desk →
        </Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {calls.slice(0, 3).map((call) => (
          <div key={call.id} className="[&_.group]:border-white/10 [&_.group]:bg-white/95">
            <CallCard
              call={call}
              interactive={!readOnly}
              compact
              showSummary={false}
              viewerUserId={viewerUserId}
              isAdmin={isAdmin}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
