import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";

function fmtDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EarningsBattleboardCommandHeader({
  summary,
}: {
  summary: EarningsBattleboardSummary;
}) {
  const headline =
    summary.reportingCount === 0
      ? "No earnings reports in the next two weeks."
      : summary.withCommunity > 0
        ? `${summary.withCommunity} reporting symbol${summary.withCommunity === 1 ? "" : "s"} with community positioning${
            summary.nextSymbol && summary.nextDate
              ? ` · Next: ${summary.nextSymbol} ${fmtDate(summary.nextDate)}`
              : ""
          }`
        : `${summary.reportingCount} symbols reporting — publish calls or follow names on the feed to fill in community columns.`;

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Pro Intelligence · Earnings
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            Earnings
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{headline}</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--pf-gray-500)]">
            Report dates = next 14 days (market calendar). Community &amp; desk stats = PortFuel calls
            on those symbols from the last 30 days.
          </p>
          <Link
            href="/dashboard/watchlist"
            className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
          >
            Watchlist calendar (your symbols only) →
          </Link>
        </div>
        <WorkspaceNewCallAction />
      </div>
    </header>
  );
}
