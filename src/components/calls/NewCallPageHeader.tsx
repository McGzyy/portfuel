import Link from "next/link";
import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { COPY } from "@/lib/copy";

export function NewCallPageHeader({
  weeklyQuota,
  fueledMode = false,
  prefilledSymbol,
  backHref = "/dashboard",
  backLabel = "Workspace overview",
}: {
  weeklyQuota: WeeklyQuotaStatus;
  fueledMode?: boolean;
  prefilledSymbol?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const { remaining, limit, tier } = weeklyQuota;

  return (
    <WorkspacePageHeader
      eyebrow={fueledMode ? "Admin · Fueled desk" : "Workspace · Publish"}
      title={COPY.publishCallCta}
      description={
        <>
          {fueledMode
            ? "House thesis on record — shows in Fueled desk, feed strip, and ticker intel."
            : "Share entry, target, and stop with the community. Stocks get news and filings on the ticker page."}
          {prefilledSymbol ? (
            <span className="font-semibold text-[var(--pf-black)]"> · {prefilledSymbol}</span>
          ) : null}
          {!fueledMode ? (
            <span className="mt-2 block text-xs text-[var(--pf-gray-400)]">
              {remaining} of {limit} call{limit === 1 ? "" : "s"} left this week
              {tier === "pro" ? " · Pro Intelligence" : ""}
            </span>
          ) : null}
        </>
      }
      footerLink={
        <Link
          href={backHref}
          className="inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
        >
          ← {backLabel}
        </Link>
      }
    />
  );
}
