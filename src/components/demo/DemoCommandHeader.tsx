import Link from "next/link";
import { LocalTimeGreeting } from "@/components/time/LocalTimeGreeting";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";

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
      "This is how your overview looks once you publish — entry, target, and stop on every call.";
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
    <WorkspacePageHeader
      className={className}
      eyebrow={
        <>
          Your workspace
          {isPro ? (
            <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-800">
              Pro layout
            </span>
          ) : (
            <span className="ml-2 rounded bg-[var(--pf-gray-100)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--pf-gray-600)]">
              Member layout
            </span>
          )}
        </>
      }
      title={
        <LocalTimeGreeting
          displayName={displayName}
          className="text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]"
        />
      }
      description={subtitle}
      action={
        <Link
          href="/pricing"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[var(--pf-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--pf-black)] hover:bg-[var(--pf-gray-50)]"
        >
          Compare plans
        </Link>
      }
    />
  );
}
