import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import { cn } from "@/lib/utils";

function greetingForHour(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function WorkspaceCommandHeader({
  displayName,
  username,
  openCallsCount,
  className,
}: {
  displayName: string;
  username: string;
  openCallsCount: number;
  className?: string;
}) {
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);

  const subtitle =
    openCallsCount > 0
      ? `${openCallsCount} open call${openCallsCount === 1 ? "" : "s"} on your book — marks refresh on load and every 15 minutes.`
      : "Publish a thesis with entry, target, and stop to start your on-record track record.";

  return (
    <header
      className={cn(
        "pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Workspace · Overview
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            {greeting}, {displayName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{subtitle}</p>
          {openCallsCount > 0 ? (
            <Link
              href="/dashboard/book"
              className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Open book →
            </Link>
          ) : null}
        </div>
        <WorkspaceNewCallAction />
      </div>
    </header>
  );
}
