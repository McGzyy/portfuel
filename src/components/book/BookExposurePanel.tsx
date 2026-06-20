import Link from "next/link";
import type { BookExposureBreakdown } from "@/lib/charts/book-analytics";
import { cn } from "@/lib/utils";

function ExposureBar({
  label,
  leftLabel,
  leftPct,
  rightLabel,
  rightPct,
  leftClass,
  rightClass,
}: {
  label: string;
  leftLabel: string;
  leftPct: number;
  rightLabel: string;
  rightPct: number;
  leftClass: string;
  rightClass: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--pf-gray-600)]">{label}</span>
        <span className="tabular-nums text-[var(--pf-gray-500)]">
          {leftLabel} {leftPct}% · {rightLabel} {rightPct}%
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-[var(--pf-gray-100)]">
        <div className={cn("h-full transition-[width]", leftClass)} style={{ width: `${leftPct}%` }} />
        <div className={cn("h-full transition-[width]", rightClass)} style={{ width: `${rightPct}%` }} />
      </div>
    </div>
  );
}

export function BookExposurePanel({ exposure }: { exposure: BookExposureBreakdown }) {
  return (
    <section className="pf-workspace-panel overflow-hidden">
      <div className="border-b border-[var(--pf-border)] px-5 py-4">
        <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">Open book exposure</h2>
        <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
          How your {exposure.openCount} live call{exposure.openCount === 1 ? "" : "s"} split by asset and
          direction
        </p>
      </div>
      <div className="space-y-5 px-5 py-5">
        <ExposureBar
          label="Asset class"
          leftLabel="Equity"
          leftPct={exposure.equityPct}
          rightLabel="Crypto"
          rightPct={exposure.cryptoPct}
          leftClass="bg-sky-500/80"
          rightClass="bg-violet-500/80"
        />
        <ExposureBar
          label="Direction"
          leftLabel="Long"
          leftPct={exposure.longPct}
          rightLabel="Short"
          rightPct={exposure.shortPct}
          leftClass="bg-emerald-500/80"
          rightClass="bg-rose-500/80"
        />
        {exposure.topSymbols.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Top symbols
            </p>
            <ul className="flex flex-wrap gap-2">
              {exposure.topSymbols.map((row) => (
                <li key={row.symbol}>
                  <Link
                    href={`/ticker/${row.symbol}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--pf-black)] hover:border-[var(--pf-red)] hover:text-[var(--pf-red)]"
                  >
                    {row.symbol}
                    <span className="font-sans font-semibold text-[var(--pf-gray-500)]">
                      {row.weightPct}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
