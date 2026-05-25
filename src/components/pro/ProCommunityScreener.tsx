import Link from "next/link";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { formatPct } from "@/lib/utils";

export function ProCommunityScreener({
  data,
  locked,
  proGateCta,
  showExport,
}: {
  data: CommunityScreenerData;
  locked: boolean;
  proGateCta: ProGateCta;
  showExport?: boolean;
}) {
  const body = (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="pf-workspace-panel p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Most called · 7 days
        </p>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Symbols with the most new member theses this week.
        </p>
        {data.mostCalled.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--pf-gray-500)]">No community calls this week yet.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              <tr>
                <th className="pb-2">Symbol</th>
                <th className="pb-2 text-right">Calls</th>
                <th className="hidden pb-2 sm:table-cell">Bias</th>
                <th className="pb-2 text-right">Best return</th>
              </tr>
            </thead>
            <tbody>
              {data.mostCalled.map((r) => (
                <tr key={r.symbol} className="border-t border-[var(--pf-border)]">
                  <td className="py-2.5">
                    <Link
                      href={`/ticker/${r.symbol}`}
                      className="font-mono font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                    >
                      {r.symbol}
                    </Link>
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">{r.callCount}</td>
                  <td className="hidden py-2.5 capitalize text-[var(--pf-gray-600)] sm:table-cell">
                    {r.latestDirection}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-emerald-700">
                    {formatPct(r.bestReturnPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="pf-workspace-panel p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Best returns · 30 days
        </p>
        <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
          Top performing member calls by realized return.
        </p>
        {data.topReturns.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--pf-gray-500)]">No scored returns in this window yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.topReturns.map((r, i) => (
              <li
                key={`${r.symbol}-${r.called_at}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/ticker/${r.symbol}`}
                    className="font-mono text-sm font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                  >
                    {r.symbol}
                  </Link>
                  <p className="truncate text-xs text-[var(--pf-gray-500)]">
                    @{r.username} · {r.direction}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-600">
                  {formatPct(r.return_pct)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {showExport && !locked ? (
        <div className="flex justify-end">
          <a
            href="/api/pro/screener/export"
            className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Export CSV →
          </a>
        </div>
      ) : null}
      <ProIntelligenceGate
        locked={locked}
        cta={proGateCta}
        title="Community screener"
        description="See what the desk is calling most and which theses are winning — Pro Intelligence."
      >
        {body}
      </ProIntelligenceGate>
    </div>
  );
}
