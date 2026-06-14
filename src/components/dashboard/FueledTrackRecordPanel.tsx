import Link from "next/link";
import { Flame, TrendingUp } from "lucide-react";
import type { FueledTrackRecord } from "@/lib/fueled/track-record";
import { formatPct, timeAgo } from "@/lib/utils";

export function FueledTrackRecordPanel({ record }: { record: FueledTrackRecord }) {
  if (record.totalCalls === 0) return null;

  return (
    <section className="pf-fueled-desk overflow-hidden p-5 sm:p-6" aria-label="Fueled desk track record">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
            <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div>
            <p className="pf-eyebrow">Track record</p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl">Fueled desk performance</h2>
            <p className="mt-1 text-sm text-slate-400">
              Official PortFuel calls — refreshed marks, separate from the member feed.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/desk"
          className="text-xs font-semibold text-red-300 hover:text-red-200 hover:underline"
        >
          Full desk →
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Desk calls</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-white">{record.totalCalls}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Avg return</dt>
          <dd
            className={
              record.avgReturnPct != null && record.avgReturnPct >= 0
                ? "mt-1 text-2xl font-bold tabular-nums text-emerald-400"
                : "mt-1 text-2xl font-bold tabular-nums text-rose-400"
            }
          >
            {formatPct(record.avgReturnPct)}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Win rate</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-white">
            {record.winRate != null ? `${record.winRate.toFixed(0)}%` : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Best call</dt>
          <dd className="mt-1 font-mono text-lg font-bold text-white">
            {record.bestSymbol ?? "—"}
            {record.bestReturnPct != null ? (
              <span className="ml-2 text-sm text-emerald-400">{formatPct(record.bestReturnPct)}</span>
            ) : null}
          </dd>
        </div>
      </dl>

      {record.recent.length > 0 ? (
        <ul className="mt-5 divide-y divide-white/10 rounded-lg border border-white/10 bg-black/20">
          {record.recent.map((c) => (
            <li key={c.id}>
              <Link
                href={`/ticker/${c.symbol}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <Flame className="h-3.5 w-3.5 text-red-400" />
                  <span className="font-mono text-sm font-bold text-white">{c.symbol}</span>
                  <span className="text-[10px] font-semibold uppercase text-slate-500">{c.direction}</span>
                </div>
                <div className="text-right">
                  <span
                    className={
                      c.return_pct != null && c.return_pct >= 0
                        ? "text-sm font-bold tabular-nums text-emerald-400"
                        : "text-sm font-bold tabular-nums text-rose-400"
                    }
                  >
                    {formatPct(c.return_pct)}
                  </span>
                  <p className="text-[10px] text-slate-500">{timeAgo(c.called_at)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
