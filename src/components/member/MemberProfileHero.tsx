import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPct } from "@/lib/utils";
import type { PublicMemberProfile } from "@/lib/users/public-profile";

export function MemberProfileHero({
  member,
  isSelf,
}: {
  member: PublicMemberProfile;
  isSelf?: boolean;
}) {
  const since = new Date(member.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <header className="pf-member-hero overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="pf-eyebrow">Member profile</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {member.display_name ?? member.username}
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-400">@{member.username}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {member.trusted ? <Badge variant="trusted">Trusted</Badge> : null}
            {isSelf ? (
              <Badge variant="default" className="border-slate-600 bg-slate-800 text-slate-200">
                You
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Rank score
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {member.rank_score.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Member since {since}</p>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Calls
          </dt>
          <dd className="mt-1 text-xl font-bold tabular-nums">{member.calls_count}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Win rate
          </dt>
          <dd className="mt-1 text-xl font-bold tabular-nums">
            {member.win_rate != null ? `${member.win_rate}%` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Avg return
          </dt>
          <dd className="mt-1 text-xl font-bold tabular-nums">
            {formatPct(member.avg_return_pct)}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Leaderboard
          </dt>
          <dd className="mt-1">
            <Link
              href="/rankings"
              className="text-sm font-semibold text-red-300 hover:text-red-200 hover:underline"
            >
              View rankings →
            </Link>
          </dd>
        </div>
      </dl>
    </header>
  );
}
