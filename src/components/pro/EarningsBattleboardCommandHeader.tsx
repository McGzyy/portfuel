import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
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
    <WorkspacePageHeader
      eyebrow="Pro Intelligence · Earnings"
      eyebrowMobileOnly
      title="Earnings"
      description={
        <>
          {headline}
          <p className="mt-2 text-xs leading-relaxed text-[var(--pf-gray-500)]">
            Report dates = next 14 days (market calendar). Community &amp; desk stats = PortFuel
            calls on those symbols from the last 30 days.
          </p>
        </>
      }
      footerLink={
        <Link
          href="/dashboard/watchlist"
          className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Watchlist calendar (your symbols only) →
        </Link>
      }
    />
  );
}
