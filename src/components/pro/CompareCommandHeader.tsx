import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";

export function CompareCommandHeader({
  symbolCount,
  watchlistCount,
}: {
  symbolCount: number;
  watchlistCount: number;
}) {
  const line =
    symbolCount >= 2
      ? `Comparing ${symbolCount} symbol${symbolCount === 1 ? "" : "s"} on a normalized % scale (3-month window).`
      : watchlistCount > 0
        ? `Pick 2–3 symbols — your watchlist has ${watchlistCount} name${watchlistCount === 1 ? "" : "s"} ready.`
        : "Add at least two tickers to see how they move together.";

  return (
    <WorkspacePageHeader
      eyebrow="Pro Intelligence · Compare"
      eyebrowMobileOnly
      title="Ticker compare"
      description={line}
      footerLink={
        <Link
          href="/dashboard/watchlist"
          className="inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
        >
          ← Watchlist
        </Link>
      }
    />
  );
}
