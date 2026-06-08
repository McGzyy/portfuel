import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import type { MemberTrackRecord } from "@/lib/users/member-track-record";

export function ProfileCallsSectionHeader({
  callCount,
  trackRecord,
}: {
  callCount: number;
  trackRecord: MemberTrackRecord;
}) {
  const decided = trackRecord.winners + trackRecord.losers;
  const winPct =
    decided > 0 ? Math.round((trackRecord.winners / decided) * 100) : null;

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Your book · Published calls
          </p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            {callCount} call{callCount === 1 ? "" : "s"} on record
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {callCount === 0
              ? "Publish your first thesis — entry, target, and stop go on your public track record."
              : winPct != null
                ? `${winPct}% win rate on closed calls · avg return ${trackRecord.avgReturnPct != null ? `${trackRecord.avgReturnPct.toFixed(1)}%` : "—"}`
                : "Manage or delete calls below — each update feeds rankings and your profile chart."}
          </p>
          <Link
            href="#performance"
            className="mt-3 inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            ↑ Performance & charts
          </Link>
        </div>
        <WorkspaceNewCallAction />
      </div>
    </header>
  );
}
