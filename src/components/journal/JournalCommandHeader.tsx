import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import { journalHubPath } from "@/lib/journal/paths";

export function JournalCommandHeader({
  ideaCount,
  withThesis,
  activeCount,
}: {
  ideaCount: number;
  withThesis: number;
  activeCount: number;
}) {
  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Research · Private journal
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            Journal
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {ideaCount} idea{ideaCount === 1 ? "" : "s"} on your watchlist — thesis, catalysts, plan
            levels, and research entries stay private until you publish a call.
            {withThesis > 0 ? (
              <span className="text-[var(--pf-gray-400)]">
                {" "}
                · {withThesis} with thesis · {activeCount} active
              </span>
            ) : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
            <Link
              href="/dashboard"
              className="text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
            >
              ← Workspace overview
            </Link>
            <Link
              href="/dashboard/watchlist"
              className="text-[var(--pf-red)] hover:underline"
            >
              Watchlist & alerts →
            </Link>
          </div>
        </div>
        <WorkspaceNewCallAction />
      </div>
    </header>
  );
}

export { journalHubPath };
