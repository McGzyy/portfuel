"use client";

import Link from "next/link";
import { SparklineProvider } from "@/components/charts/SparklineProvider";
import { SymbolSparkline } from "@/components/charts/SymbolSparkline";
import { SymbolAvatar } from "@/components/market/SymbolAvatar";
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
      <section className="pf-workspace-panel flex flex-col" aria-label="Your open calls">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--pf-border)] px-5 py-4">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">
              Your open calls
            </h2>
            <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
              {calls.length} active thesis{calls.length === 1 ? "" : "es"} on your book
            </p>
          </div>
          <Link
            href="/dashboard/book"
            className="shrink-0 text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Open book →
          </Link>
        </div>
        <ul className="flex gap-3 overflow-x-auto p-4 pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {calls.slice(0, 6).map((c) => (
            <li
              key={c.id}
              className="relative min-w-[11.5rem] shrink-0 cursor-pointer rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5 transition-colors hover:border-[var(--pf-gray-300)]"
            >
              <Link
                href={`/ticker/${c.symbol}`}
                className="absolute inset-0 z-0 rounded-[inherit]"
                aria-label={`View ${c.symbol} call`}
              />
              <div className="pointer-events-none relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <SymbolAvatar symbol={c.symbol} assetClass={c.asset_class} size="xs" />
                    <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
                      {c.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <SymbolSparkline symbol={c.symbol} width={40} height={18} />
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        (c.return_pct ?? 0) >= 0 ? "pf-return-up" : "pf-return-down"
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
              </div>
            </li>
          ))}
        </ul>
      </section>
    </SparklineProvider>
  );
}
