"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RankScoreBar } from "@/components/rankings/RankScoreBar";
import { RankingsFollowCell } from "@/components/rankings/RankingsFollowCell";
import type { LeaderboardEntry } from "@/lib/calls/leaderboard";
import {
  nextSortDirection,
  sortLeaderboardRows,
  type LeaderboardSortKey,
  type SortDirection,
} from "@/lib/rankings/sort-leaderboard";
import { cn } from "@/lib/utils";

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: LeaderboardSortKey;
  activeKey: LeaderboardSortKey;
  direction: SortDirection;
  onSort: (key: LeaderboardSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={cn("px-4 py-3", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-[var(--pf-black)]",
          active ? "text-[var(--pf-black)]" : "text-[var(--pf-gray-500)]"
        )}
      >
        {label}
        <Icon className="h-3 w-3 shrink-0 opacity-70" strokeWidth={2.25} aria-hidden />
      </button>
    </th>
  );
}

export function LeaderboardTable({
  rows,
  embedded,
  viewerUserId,
  followingIds = [],
}: {
  rows: LeaderboardEntry[];
  embedded?: boolean;
  viewerUserId?: string | null;
  followingIds?: string[];
}) {
  const [sortKey, setSortKey] = useState<LeaderboardSortKey>("score");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const sortedRows = useMemo(
    () => sortLeaderboardRows(rows, sortKey, sortDir),
    [rows, sortKey, sortDir]
  );

  const maxScore = rows.length > 0 ? Math.max(...rows.map((r) => r.rank_score)) : 0;
  const followingSet = new Set(followingIds);
  const showFollow = Boolean(viewerUserId);

  const onSort = (key: LeaderboardSortKey) => {
    setSortDir((dir) => nextSortDirection(sortKey, key, dir));
    setSortKey(key);
  };

  if (rows.length === 0) {
    return (
      <div className="pf-empty">
        <p className="font-medium text-[var(--pf-gray-700)]">No ranked callers yet</p>
        <p className="mt-1 text-sm">Publish calls and build your track record.</p>
      </div>
    );
  }

  return (
    <div
      className={
        embedded ? "overflow-hidden" : "overflow-hidden pf-card-elevated"
      }
    >
      <div className="max-h-[min(70vh,42rem)] overflow-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-xs font-semibold uppercase tracking-wide shadow-[0_1px_0_var(--pf-border)]">
            <tr>
              <th className="px-4 py-3 text-[var(--pf-gray-500)]">#</th>
              <SortHeader
                label="Caller"
                sortKey="name"
                activeKey={sortKey}
                direction={sortDir}
                onSort={onSort}
              />
              <th className="hidden px-4 py-3 text-[var(--pf-gray-500)] sm:table-cell">Handle</th>
              <SortHeader
                label="Score"
                sortKey="score"
                activeKey={sortKey}
                direction={sortDir}
                onSort={onSort}
                className="text-right"
              />
              <th className="hidden px-4 py-3 text-[var(--pf-gray-500)] lg:table-cell">Momentum</th>
              <SortHeader
                label="Win rate"
                sortKey="win_rate"
                activeKey={sortKey}
                direction={sortDir}
                onSort={onSort}
                className="hidden text-right sm:table-cell"
              />
              <SortHeader
                label="Calls"
                sortKey="calls"
                activeKey={sortKey}
                direction={sortDir}
                onSort={onSort}
                className="hidden text-right md:table-cell"
              />
              {showFollow ? (
                <th className="px-4 py-3 text-right text-[var(--pf-gray-500)]">Follow</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={row.id}
                className="border-b border-[var(--pf-border)] last:border-0 hover:bg-[var(--pf-gray-50)]"
              >
                <td className="px-4 py-4 font-bold tabular-nums text-[var(--pf-gray-400)]">
                  {i + 1}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.username ? (
                      <Link
                        href={`/member/${row.username}`}
                        className="font-semibold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                      >
                        {row.display_name ?? row.username}
                      </Link>
                    ) : (
                      <span className="font-semibold text-[var(--pf-black)]">
                        {row.display_name ?? "Member"}
                      </span>
                    )}
                    {row.trusted ? <Badge variant="trusted">Trusted</Badge> : null}
                    {row.founding ? (
                      <Badge className="border border-amber-200 bg-amber-50 text-amber-800">
                        Founding
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className="hidden px-4 py-4 font-mono text-xs text-[var(--pf-gray-500)] sm:table-cell">
                  {row.username ? `@${row.username}` : "—"}
                </td>
                <td className="px-4 py-4 text-right font-bold tabular-nums text-[var(--pf-black)]">
                  {row.rank_score.toFixed(1)}
                </td>
                <td className="hidden px-4 py-4 lg:table-cell">
                  <RankScoreBar score={row.rank_score} maxScore={maxScore} />
                </td>
                <td className="hidden px-4 py-4 text-right tabular-nums text-[var(--pf-gray-600)] sm:table-cell">
                  {row.win_rate != null ? `${row.win_rate.toFixed(0)}%` : "—"}
                </td>
                <td className="hidden px-4 py-4 text-right tabular-nums text-[var(--pf-gray-600)] md:table-cell">
                  {row.calls_count}
                </td>
                {showFollow ? (
                  <td className="px-4 py-4 text-right">
                    <RankingsFollowCell
                      memberId={row.id}
                      memberUsername={row.username}
                      initialFollowing={followingSet.has(row.id)}
                      isSelf={row.id === viewerUserId}
                    />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
