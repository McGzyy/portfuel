"use client";

import Link from "next/link";
import { ReturnLineChart } from "@/components/charts/ReturnLineChart";
import type { ReturnChartPoint } from "@/lib/charts/types";
import { formatPct } from "@/lib/utils";

export function OverviewPerformanceChart({
  points,
  profileHref,
}: {
  points: ReturnChartPoint[];
  profileHref: string;
}) {
  const last = points[points.length - 1]?.value;
  const lastAccent =
    last == null ? "text-[var(--pf-gray-400)]" : last >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <section className="pf-workspace-panel overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--pf-border)] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[var(--pf-black)]">
            Your performance
          </h2>
          <p className="mt-0.5 text-xs text-[var(--pf-gray-500)]">
            Cumulative return on published calls
          </p>
        </div>
        {last != null ? (
          <p className={`text-lg font-bold tabular-nums ${lastAccent}`}>{formatPct(last)}</p>
        ) : null}
      </div>
      <div className="p-2">
        {points.length > 0 ? (
          <ReturnLineChart points={points} height={140} compact interactive showMarkers />
        ) : (
          <div className="flex h-[140px] flex-col items-center justify-center px-4 text-center text-xs text-[var(--pf-gray-500)]">
            <p>Publish a call to start tracking performance.</p>
            <Link
              href="/calls/new"
              className="mt-2 font-semibold text-[var(--pf-red)] hover:underline"
            >
              Publish a call →
            </Link>
          </div>
        )}
      </div>
      <div className="border-t border-[var(--pf-border)] px-5 py-3 text-center">
        <Link
          href={profileHref}
          className="text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Full profile & history →
        </Link>
      </div>
    </section>
  );
}
