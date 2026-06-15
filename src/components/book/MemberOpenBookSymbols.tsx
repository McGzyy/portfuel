import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SymbolAvatar } from "@/components/market/SymbolAvatar";
import type { MemberBookSymbolRow } from "@/lib/calls/member-book";
import { cn, formatPct } from "@/lib/utils";

export function MemberOpenBookSymbols({ rows }: { rows: MemberBookSymbolRow[] }) {
  if (rows.length === 0) return null;

  const totalCalls = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="pf-workspace-panel overflow-hidden">
      <div className="border-b border-[var(--pf-border)] px-5 py-4">
        <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">Symbol exposure</h2>
        <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
          How your open theses split across tickers
        </p>
      </div>
      <ul className="divide-y divide-[var(--pf-border)]">
        {rows.map((row) => {
          const weightPct = totalCalls > 0 ? Math.round((row.count / totalCalls) * 100) : 0;

          return (
          <li key={row.symbol} className="px-5 py-3">
            <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/ticker/${row.symbol}`}
              className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
            >
              <SymbolAvatar symbol={row.symbol} size="xs" />
              {row.symbol}
            </Link>
            <span className="text-xs text-[var(--pf-gray-500)]">
              {row.count} open call{row.count === 1 ? "" : "s"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {row.longCount > 0 ? (
                <Badge variant="long">{row.longCount} long</Badge>
              ) : null}
              {row.shortCount > 0 ? (
                <Badge variant="short">{row.shortCount} short</Badge>
              ) : null}
            </div>
            {row.avgReturnPct != null ? (
              <span
                className={cn(
                  "ml-auto text-xs font-bold tabular-nums",
                  row.avgReturnPct >= 0 ? "pf-return-up" : "pf-return-down"
                )}
              >
                {formatPct(row.avgReturnPct)} avg
              </span>
            ) : null}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--pf-gray-100)]">
                <div
                  className="h-full rounded-full bg-[var(--pf-red)]/80 transition-[width] duration-300"
                  style={{ width: `${weightPct}%` }}
                />
              </div>
              <span className="w-8 text-right text-[10px] font-semibold tabular-nums text-[var(--pf-gray-500)]">
                {weightPct}%
              </span>
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
