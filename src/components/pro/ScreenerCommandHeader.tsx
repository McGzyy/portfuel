import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import type { CommunityScreenerData } from "@/lib/screener/community";

export function ScreenerCommandHeader({ data }: { data: CommunityScreenerData }) {
  const topCalled = data.mostCalled[0];
  const topReturn = data.topReturns[0];
  const calledLine = topCalled
    ? `Most called: ${topCalled.symbol} (${topCalled.callCount} thesis${topCalled.callCount === 1 ? "" : "es"})`
    : "No community calls yet this window.";
  const returnLine =
    topReturn != null
      ? ` · Best return: ${topReturn.symbol} ${Number(topReturn.return_pct).toFixed(1)}%`
      : "";

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Pro Intelligence · Screener
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            Community screener
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {calledLine}
            {returnLine} — activity, target progress, desk vs crowd, and conviction filters.
          </p>
          <Link
            href="/dashboard/feed"
            className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Open member feed →
          </Link>
        </div>
        <WorkspaceNewCallAction />
      </div>
    </header>
  );
}
