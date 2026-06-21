import { PublishIdentityIndicator } from "@/components/calls/PublishIdentityIndicator";
import { LocalTimeGreeting } from "@/components/time/LocalTimeGreeting";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";
import { cn } from "@/lib/utils";

export function WorkspaceCommandHeader({
  displayName,
  openCallsCount,
  pendingEntryCount = 0,
  isAdmin = false,
  isPro = false,
  className,
}: {
  displayName: string;
  username: string;
  openCallsCount: number;
  pendingEntryCount?: number;
  isAdmin?: boolean;
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
        "pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-4 py-3.5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-5",
        "lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none",
        className
      )}
    >
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)] lg:hidden">
            Workspace · Overview
          </p>
          {isAdmin ? <PublishIdentityIndicator /> : null}
        </div>
        <LocalTimeGreeting
          displayName={displayName}
          className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem] lg:mt-0 lg:text-[2rem]"
        />
        <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{subtitle}</p>
      </div>
    </header>
  );
}
