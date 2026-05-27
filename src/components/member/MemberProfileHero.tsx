import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FollowMemberButton } from "@/components/member/FollowMemberButton";
import { MessageMemberButton } from "@/components/member/MessageMemberButton";
import { formatPct } from "@/lib/utils";
import type { PublicMemberProfile } from "@/lib/users/public-profile";

export function MemberProfileHero({
  member,
  isSelf,
  initialFollowing,
}: {
  member: PublicMemberProfile;
  isSelf?: boolean;
  initialFollowing?: boolean;
}) {
  const since = new Date(member.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <header className="pf-workspace-panel overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--pf-gray-500)]">
            Member profile
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-3xl">
            {member.display_name ?? member.username}
          </h1>
          <p className="mt-1 font-mono text-sm text-[var(--pf-gray-500)]">@{member.username}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {member.trusted ? <Badge variant="trusted">Trusted</Badge> : null}
            {member.founding ? (
              <Badge className="border border-amber-200 bg-amber-50 text-amber-800">
                Founding
              </Badge>
            ) : null}
            {isSelf ? <Badge variant="default">You</Badge> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          {!isSelf ? (
            <div className="flex flex-wrap justify-end gap-2">
              <MessageMemberButton username={member.username} />
              <FollowMemberButton
                memberId={member.id}
                memberUsername={member.username}
                initialFollowing={initialFollowing ?? false}
              />
            </div>
          ) : null}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
              Rank score
            </p>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-[var(--pf-black)]">
              {member.rank_score.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-[var(--pf-gray-500)]">Member since {since}</p>
          </div>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-[var(--pf-border)] pt-6 sm:grid-cols-4">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
            Calls
          </dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--pf-black)]">
            {member.calls_count}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
            Win rate
          </dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--pf-black)]">
            {member.win_rate != null ? `${member.win_rate}%` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
            Avg return
          </dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--pf-black)]">
            {formatPct(member.avg_return_pct)}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
            Leaderboard
          </dt>
          <dd className="mt-1">
            <Link
              href="/rankings"
              className="text-sm font-semibold text-[var(--pf-red)] hover:underline"
            >
              View rankings →
            </Link>
          </dd>
        </div>
      </dl>
    </header>
  );
}
