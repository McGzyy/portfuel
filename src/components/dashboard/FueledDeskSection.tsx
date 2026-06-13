import Link from "next/link";
import type { CallCardData } from "@/components/calls/CallCard";
import { FueledDeskCallGrid } from "@/components/dashboard/FueledDeskCallGrid";
import { formatPct } from "@/lib/utils";

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

  const leader = [...calls].sort(
    (a, b) => (b.return_pct ?? -Infinity) - (a.return_pct ?? -Infinity)
  )[0];

  return (
    <section className="pf-fueled-desk p-5 sm:p-6" aria-label="PortFuel Fueled desk">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="pf-eyebrow">PortFuel Fueled</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Desk calls</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Official PortFuel theses — curated by the desk, separate from member flow.
          </p>
          {leader?.return_pct != null ? (
            <p className="mt-2 text-sm font-medium text-slate-300">
              Leading:{" "}
              <Link
                href={`/ticker/${leader.symbol}`}
                className="font-semibold text-red-300 hover:text-red-200 hover:underline"
              >
                ${leader.symbol}
              </Link>{" "}
              <span className="tabular-nums text-emerald-400">{formatPct(leader.return_pct)}</span>
              {calls.length > 1 ? (
                <span className="text-slate-500"> · {calls.length} open desk calls</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <Link
          href={deskHref}
          className="text-xs font-semibold text-red-300 hover:text-red-200 hover:underline"
        >
          Open Fueled desk →
        </Link>
      </div>
      <FueledDeskCallGrid
        calls={calls}
        viewerUserId={viewerUserId}
        isAdmin={isAdmin}
        readOnly={readOnly}
      />
    </section>
  );
}
