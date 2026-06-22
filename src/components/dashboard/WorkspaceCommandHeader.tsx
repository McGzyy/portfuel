import { LocalTimeGreeting } from "@/components/time/LocalTimeGreeting";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";

export function WorkspaceCommandHeader({
  displayName,
  openCallsCount,
  pendingEntryCount = 0,
  isPro = false,
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
    <WorkspacePageHeader
      eyebrow="Workspace · Overview"
      eyebrowMobileOnly
      title={
        <LocalTimeGreeting
          displayName={displayName}
          className="text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem] lg:text-[2rem]"
        />
      }
      description={subtitle}
    />
  );
}
