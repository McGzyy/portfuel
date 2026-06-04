import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import type { MemberTrackRecord } from "@/lib/users/member-track-record";

export function MemberCallsSectionHeader({
  username,
  displayName,
  callCount,
  trackRecord,
  isSelf,
}: {
  username: string;
  displayName: string | null;
  callCount: number;
  trackRecord: MemberTrackRecord;
  isSelf: boolean;
}) {
  const name = displayName ?? username;
  const decided = trackRecord.winners + trackRecord.losers;
  const winPct =
    decided > 0 ? Math.round((trackRecord.winners / decided) * 100) : null;

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Member · Call history
          </p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            {name}&apos;s theses
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {callCount} published call{callCount === 1 ? "" : "s"}
            {winPct != null ? (
              <span className="text-[var(--pf-gray-400)]">
                {" "}
                · {winPct}% win rate on closed
              </span>
            ) : null}
            {isSelf
              ? " — this is what other members see on your public profile."
              : ` — timestamped theses from @${username}.`}
          </p>
          {!isSelf ? (
            <Link
              href="/dashboard/feed?filter=following"
              className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Your following feed →
            </Link>
          ) : null}
        </div>
        {isSelf ? <WorkspaceNewCallAction /> : null}
      </div>
    </header>
  );
}
