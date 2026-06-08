import Link from "next/link";
import { JournalExportButton } from "@/components/journal/JournalExportButton";
import { JournalHeaderAction } from "@/components/journal/JournalHeaderAction";
import type { JournalNextUp } from "@/lib/journal/next-up";
import type { BookPostureSummary } from "@/lib/watchlist/book-posture";

export function JournalCommandHeader({
  ideaCount,
  withThesis,
  activeCount,
  nextUp,
  proUnlocked = false,
  bookPosture,
}: {
  ideaCount: number;
  withThesis: number;
  activeCount: number;
  nextUp?: JournalNextUp | null;
  proUnlocked?: boolean;
  bookPosture?: BookPostureSummary | null;
}) {
  const postureLine =
    bookPosture && bookPosture.inBook > 0
      ? [
          bookPosture.active > 0 ? `${bookPosture.active} active` : null,
          bookPosture.trimming > 0 ? `${bookPosture.trimming} trimming` : null,
          bookPosture.building > 0 ? `${bookPosture.building} building` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : null;
  return (
    <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Research · Private journal
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
            Journal
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
            {ideaCount === 0
              ? "Add symbols on your watchlist — each gets a private research notebook."
              : `${ideaCount} idea${ideaCount === 1 ? "" : "s"} — thesis, catalysts, plan levels, and entries stay private until you publish.`}
            {withThesis > 0 ? (
              <span className="text-[var(--pf-gray-400)]">
                {" "}
                · {withThesis} with thesis · {activeCount} active
              </span>
            ) : null}
            {postureLine ? (
              <span className="font-medium text-[var(--pf-gray-600)]">
                {" "}
                · Book: {postureLine}
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
              className="text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
            >
              Watchlist & alerts
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <JournalExportButton proUnlocked={proUnlocked} />
          {nextUp ? <JournalHeaderAction nextUp={nextUp} /> : null}
        </div>
      </div>
    </header>
  );
}
