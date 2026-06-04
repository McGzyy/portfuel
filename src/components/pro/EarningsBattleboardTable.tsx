import Link from "next/link";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import type { EarningsBattleboardRow } from "@/lib/earnings/battleboard";
import { cn, formatPct } from "@/lib/utils";

function fmtDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function hourLabel(hour: string): string {
  if (hour === "bmo") return "BMO";
  if (hour === "amc") return "AMC";
  return hour ? hour.toUpperCase() : "—";
}

export function EarningsBattleboardTable({ rows }: { rows: EarningsBattleboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="pf-workspace-panel px-6 py-12 text-center text-sm text-[var(--pf-gray-500)]">
        No earnings dates in the next two weeks. Check back as the calendar fills in.
      </div>
    );
  }

  const positioned = rows.filter((r) => r.communityCalls > 0).length;
  const divergent = rows.filter(
    (r) =>
      r.communityCalls >= 2 &&
      r.deskDirection != null &&
      (r.communityLongPct >= 50 ? "long" : "short") !== r.deskDirection
  ).length;

  return (
    <div className="space-y-4">
      <MetricsStrip
        eyebrow="Next 14 days"
        items={[
          { label: "Reporting", value: String(rows.length) },
          { label: "With calls", value: String(positioned), accent: positioned > 0 ? "positive" : undefined },
          { label: "Desk diverge", value: String(divergent) },
        ]}
      />

      <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-[10px] font-semibold uppercase tracking-wider text-[var(--pf-gray-500)]">
                <th className="px-4 py-3.5">Symbol</th>
                <th className="px-4 py-3.5">Reports</th>
                <th className="px-4 py-3.5">Community</th>
                <th className="px-4 py-3.5">Desk</th>
                <th className="px-4 py-3.5">Best return</th>
                <th className="px-4 py-3.5">Target %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pf-border)]">
              {rows.map((row) => {
                const crowdLean: "long" | "short" | null =
                  row.communityCalls >= 2
                    ? row.communityLongPct >= 50
                      ? "long"
                      : "short"
                    : null;
                const diverges =
                  crowdLean != null &&
                  row.deskDirection != null &&
                  crowdLean !== row.deskDirection;

                return (
                  <tr key={`${row.symbol}-${row.date}`} className="hover:bg-[var(--pf-gray-50)]/80">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/ticker/${row.symbol}`}
                        className="font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                      >
                        ${row.symbol}
                      </Link>
                      {diverges ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Diverge
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--pf-gray-600)]">
                      <span className="font-medium text-[var(--pf-black)]">{fmtDate(row.date)}</span>
                      <span className="ml-1.5 text-xs text-[var(--pf-gray-400)]">
                        {hourLabel(row.hour)}
                        {row.quarter ? ` · Q${row.quarter}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {row.communityCalls > 0 ? (
                        <span className="text-[var(--pf-gray-700)]">
                          {row.communityCalls} call{row.communityCalls === 1 ? "" : "s"}
                          <span className="ml-1 text-xs text-[var(--pf-gray-400)]">
                            · {row.communityLongPct}% long
                          </span>
                        </span>
                      ) : (
                        <span className="text-[var(--pf-gray-400)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {row.deskDirection ? (
                        <span
                          className={cn(
                            "font-semibold capitalize",
                            row.deskDirection === "long" ? "text-emerald-700" : "text-rose-700"
                          )}
                        >
                          {row.deskDirection}
                        </span>
                      ) : (
                        <span className="text-[var(--pf-gray-400)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-semibold">
                      {formatPct(row.bestReturnPct)}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-[var(--pf-gray-600)]">
                      {row.avgTargetProgress != null ? `${row.avgTargetProgress}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
