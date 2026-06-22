import Link from "next/link";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { MarketQuoteContextLine } from "@/components/market/MarketQuoteContextLine";
import type { FeedTab } from "@/lib/dashboard/nav";

function modeLabel(mode: FeedTab): string {
  switch (mode) {
    case "performing":
      return "Top performers · 30-day returns";
    case "progress":
      return "Near target · sorted by progress";
    default:
      return "Latest · newest first";
  }
}

export function FeedCommandHeader({
  resultCount,
  mode,
  newCount,
  showNewOnly,
  quotesUpdatedAt,
  isPro = false,
}: {
  resultCount: number;
  mode: FeedTab;
  newCount: number;
  showNewOnly: boolean;
  quotesUpdatedAt?: string | null;
  isPro?: boolean;
}) {
  return (
    <WorkspacePageHeader
      eyebrow="Community · Feed"
      eyebrowMobileOnly
      title="Member feed"
      description={
        <>
          {resultCount} call{resultCount === 1 ? "" : "s"} in this view · {modeLabel(mode)}
          {newCount > 0 ? (
            <span className="font-semibold text-emerald-700">
              {" "}
              · {newCount} new{showNewOnly ? " (filtered)" : ""}
            </span>
          ) : null}
          <MarketQuoteContextLine
            className="mt-2"
            isPro={isPro}
            updatedAt={quotesUpdatedAt}
          />
        </>
      }
      footerLink={
        <Link
          href="/dashboard"
          className="hidden text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline sm:inline-block"
        >
          ← Workspace overview
        </Link>
      }
    />
  );
}
