import { Badge } from "@/components/ui/badge";
import type { LeaderboardEntry } from "@/lib/calls/leaderboard";

export function LeaderboardTable({ rows }: { rows: LeaderboardEntry[] }) {
  if (rows.length === 0) {
    return (
      <div className="pf-empty">
        <p className="font-medium text-[var(--pf-gray-700)]">No ranked callers yet</p>
        <p className="mt-1 text-sm">Submit calls and build your track record.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Caller</th>
            <th className="hidden px-4 py-3 sm:table-cell">Handle</th>
            <th className="px-4 py-3 text-right">Score</th>
            <th className="hidden px-4 py-3 text-right sm:table-cell">Win rate</th>
            <th className="hidden px-4 py-3 text-right md:table-cell">Calls</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className="border-b border-[var(--pf-border)] last:border-0 hover:bg-[var(--pf-gray-50)]"
            >
              <td className="px-4 py-4 font-bold tabular-nums text-[var(--pf-gray-400)]">
                {i + 1}
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--pf-black)]">
                    {row.display_name ?? "Member"}
                  </span>
                  {row.trusted ? <Badge variant="trusted">Trusted</Badge> : null}
                </div>
              </td>
              <td className="hidden px-4 py-4 font-mono text-xs text-[var(--pf-gray-500)] sm:table-cell">
                {row.username ? `@${row.username}` : "—"}
              </td>
              <td className="px-4 py-4 text-right font-bold tabular-nums text-[var(--pf-black)]">
                {row.rank_score.toFixed(1)}
              </td>
              <td className="hidden px-4 py-4 text-right tabular-nums text-[var(--pf-gray-600)] sm:table-cell">
                {row.win_rate != null ? `${row.win_rate.toFixed(0)}%` : "—"}
              </td>
              <td className="hidden px-4 py-4 text-right tabular-nums text-[var(--pf-gray-600)] md:table-cell">
                {row.calls_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
