import Link from "next/link";
import { LocalTimeGreeting } from "@/components/time/LocalTimeGreeting";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";
import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

export function DemoCommandHeader({
  displayName,
  openCallsCount,
  pendingEntryCount = 0,
  isPro = false,
  className,
}: {
  displayName: string;
  openCallsCount: number;
  pendingEntryCount?: number;
  isPro?: boolean;
  className?: string;
}) {
  const activeOpen = Math.max(0, openCallsCount - pendingEntryCount);
  let subtitle: string;
  if (openCallsCount === 0) {
    subtitle =
      "Publish a thesis with entry, target, and stop to start your on-record track record.";
  } else {
    const openLabel =
      activeOpen > 0
        ? `${activeOpen} active call${activeOpen === 1 ? "" : "s"}`
        : null;
    const pendingLabel =
      pendingEntryCount > 0
        ? `${pendingEntryCount} awaiting entry`
        : null;
    const counts = [openLabel, pendingLabel].filter(Boolean).join(" · ");
    subtitle = `${counts} on your book — ${quotesRefreshLabel({ isPro }).replace(/^./, (c) => c.toLowerCase())}.`;
  }

  return (
    <header
      className={cn(
        "pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-4 py-4 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Workspace · Overview
            {isPro ? (
              <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-800">
                Pro preview
              </span>
            ) : (
              <span className="ml-2 rounded bg-[var(--pf-gray-100)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--pf-gray-600)]">
                Member preview
              </span>
            )}
          </p>
          <LocalTimeGreeting
            displayName={displayName}
            className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]"
          />
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{subtitle}</p>
          {openCallsCount > 0 ? (
            <p className="mt-3 text-xs font-medium text-[var(--pf-gray-500)]">
              Sample book data — publishing unlocks after join.
            </p>
          ) : null}
        </div>
        <Link
          href="/join"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--pf-red)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--pf-red-hover)]"
        >
          {COPY.publishCallCta}
        </Link>
      </div>
    </header>
  );
}
