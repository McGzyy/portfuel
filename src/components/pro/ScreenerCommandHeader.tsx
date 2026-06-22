import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
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
    <WorkspacePageHeader
      eyebrow="Pro Intelligence · Screener"
      eyebrowMobileOnly
      title="Community screener"
      description={`${calledLine}${returnLine} — activity, target progress, desk vs crowd, and conviction filters.`}
      footerLink={
        <Link
          href="/dashboard/feed"
          className="inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
        >
          Open member feed →
        </Link>
      }
    />
  );
}
