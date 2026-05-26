"use client";

import Link from "next/link";
import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { SymbolSparkline } from "@/components/charts/SymbolSparkline";
import { formatPct } from "@/lib/utils";
import type { CallCardData } from "@/components/calls/CallCard";

export function YourPositionsStrip({
  calls,
  username,
}: {
  calls: CallCardData[];
  username: string;
}) {
  if (calls.length === 0) return null;

  return (
    <SparklineProvider symbols={calls.map((c) => c.symbol)}>
      <section className="pf-elite-panel p-4" aria-label="Your recent positions">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Your book
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--pf-black)]">
              Recent calls you published
            </p>
          </div>
          <Link
            href={`/member/${username}`}
            className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Full profile →
          </Link>
        </div>
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {calls.slice(0, 5).map((c) => (
            <li
              key={c.id}
              className="min-w-[11.5rem] shrink-0 rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-white px-3 py-2.5 shadow-[var(--pf-shadow-sm)]"
            >
              <Link href={`/ticker/${c.symbol}`} className="block">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold">{c.symbol}</span>
                  <div className="flex items-center gap-1.5">
                    <SymbolSparkline symbol={c.symbol} width={40} height={18} />
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      (c.return_pct ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatPct(c.return_pct)}
                  </span>
                  </div>
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--pf-gray-400)]">
                  {c.direction}
                  {c.is_fueled ? " · Fueled" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </SparklineProvider>
  );
}
