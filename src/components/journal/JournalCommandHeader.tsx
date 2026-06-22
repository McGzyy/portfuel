import Link from "next/link";
import { JournalExportButton } from "@/components/journal/JournalExportButton";
import { JournalHeaderAction } from "@/components/journal/JournalHeaderAction";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
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
    <WorkspacePageHeader
      eyebrow="Research · Private journal"
      title="Journal"
      description={
        <>
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
            <>
              {" "}
              ·{" "}
              <Link
                href="/dashboard/journal?filter=in_book#journal-ideas"
                className="font-medium text-[var(--pf-gray-600)] hover:text-[var(--pf-red)] hover:underline"
              >
                Book: {postureLine}
              </Link>
            </>
          ) : null}
        </>
      }
      footerLink={
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
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
      }
      action={
        <div className="flex flex-col items-end gap-2">
          <JournalExportButton proUnlocked={proUnlocked} />
          {nextUp ? <JournalHeaderAction nextUp={nextUp} /> : null}
        </div>
      }
    />
  );
}
