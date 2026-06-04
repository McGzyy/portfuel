import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import type { FeedTab } from "@/lib/dashboard/nav";
import { cn } from "@/lib/utils";

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
}: {
  resultCount: number;
  mode: FeedTab;
  newCount: number;
  showNewOnly: boolean;
}) {
  return (
    <header
      className={cn(
        "pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Community · Feed
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            Member feed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {resultCount} call{resultCount === 1 ? "" : "s"} in this view · {modeLabel(mode)}
            {newCount > 0 ? (
              <span className="font-semibold text-emerald-700">
                {" "}
                · {newCount} new{showNewOnly ? " (filtered)" : ""}
              </span>
            ) : null}
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-xs font-semibold text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
          >
            ← Workspace overview
          </Link>
        </div>
        <WorkspaceNewCallAction />
      </div>
    </header>
  );
}
