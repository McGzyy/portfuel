"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FollowMemberButton } from "@/components/member/FollowMemberButton";
import type { SuggestedFollow } from "@/lib/follows/types";
import { formatPct } from "@/lib/utils";

export function SuggestedFollowsPanel({
  suggestions,
  followingIds,
  viewerUserId,
}: {
  suggestions: SuggestedFollow[];
  followingIds: string[];
  viewerUserId: string;
}) {
  const followingSet = new Set(followingIds);
  const visible = suggestions.filter(
    (s) => s.userId !== viewerUserId && !followingSet.has(s.userId)
  );

  if (visible.length === 0) return null;

  return (
    <section className="pf-workspace-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            Suggested follows
          </p>
          <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
            Callers active on symbols in your watchlist — follow to see their theses in your feed.
          </p>
        </div>
        <Link
          href="/dashboard/feed?filter=following"
          className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Following feed →
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-[var(--pf-border)]">
        {visible.map((s) => (
          <li key={s.userId} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/member/${s.username}`}
                  className="font-semibold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                >
                  {s.displayName ?? s.username}
                </Link>
                <span className="font-mono text-xs text-[var(--pf-gray-500)]">@{s.username}</span>
                {s.trusted ? <Badge variant="trusted">Trusted</Badge> : null}
              </div>
              <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
                {s.reason}
                {s.avgReturnPct != null ? (
                  <span className="tabular-nums text-[var(--pf-gray-600)]">
                    {" · "}
                    {formatPct(s.avgReturnPct)} avg on overlap
                  </span>
                ) : null}
              </p>
            </div>
            <FollowMemberButton
              memberId={s.userId}
              memberUsername={s.username}
              initialFollowing={false}
              compact
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
