import Link from "next/link";
import {
  WorkspaceNewCallAction,
  WorkspacePageHeader,
} from "@/components/dashboard/WorkspacePageHeader";
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
    <WorkspacePageHeader
      eyebrow="Your book · Published calls"
      title={`${callCount} call${callCount === 1 ? "" : "s"} on record`}
      description={
        callCount === 0
          ? "Publish your first thesis — entry, target, and stop go on your public track record."
          : winPct != null
            ? `${winPct}% win rate on closed calls · avg return ${trackRecord.avgReturnPct != null ? `${trackRecord.avgReturnPct.toFixed(1)}%` : "—"}`
            : "Close positions or publish new calls below — each update feeds rankings and your profile chart."
      }
      action={<WorkspaceNewCallAction />}
      footerLink={
        <Link
          href="#performance"
          className="inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
        >
          ↑ Performance & charts
        </Link>
      }
    />
  );
}
