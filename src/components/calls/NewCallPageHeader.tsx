import Link from "next/link";
import type { WeeklyQuotaStatus } from "@/lib/members/weekly-quota";
import { COPY } from "@/lib/copy";

export function NewCallPageHeader({
  weeklyQuota,
  fueledMode = false,
  prefilledSymbol,
}: {
  weeklyQuota: WeeklyQuotaStatus;
  fueledMode?: boolean;
  prefilledSymbol?: string;
}) {
  const { remaining, limit, tier } = weeklyQuota;

  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
        {fueledMode ? "Admin · Fueled desk" : "Workspace · Publish"}
      </p>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
        {COPY.publishCallCta}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
        {fueledMode
          ? "House thesis on record — shows in Fueled desk, feed strip, and ticker intel."
          : "Share entry, target, and stop with the community. Stocks get news and filings on the ticker page."}
        {prefilledSymbol ? (
          <span className="font-semibold text-[var(--pf-black)]"> · {prefilledSymbol}</span>
        ) : null}
      </p>
      <p className="mt-2 text-xs text-[var(--pf-gray-400)]">
        {remaining} of {limit} call{limit === 1 ? "" : "s"} left this week
        {tier === "pro" ? " · Pro Intelligence" : ""}
      </p>
      <Link
        href="/dashboard"
        className="mt-3 inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
      >
        ← Workspace overview
      </Link>
    </header>
  );
}
