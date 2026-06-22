import Link from "next/link";
import {
  WorkspaceNewCallAction,
  WorkspacePageHeader,
} from "@/components/dashboard/WorkspacePageHeader";
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
    <WorkspacePageHeader
      eyebrow="Member · Call history"
      title={`${name}'s theses`}
      description={
        <>
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
        </>
      }
      action={isSelf ? <WorkspaceNewCallAction /> : undefined}
      footerLink={
        !isSelf ? (
          <Link
            href="/dashboard/feed?filter=following"
            className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Your following feed →
          </Link>
        ) : undefined
      }
    />
  );
}
