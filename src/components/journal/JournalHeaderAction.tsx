import Link from "next/link";
import { NotebookPen } from "lucide-react";
import type { JournalNextUp } from "@/lib/journal/next-up";

/** Page-local journal CTA — not community publish. */
export function JournalHeaderAction({ nextUp }: { nextUp: JournalNextUp }) {
  return (
    <Link
      href={nextUp.href}
      className="pf-accent-btn inline-flex h-10 items-center justify-center gap-2 rounded-[var(--pf-radius)] px-4 text-sm font-semibold shadow-[var(--pf-shadow-sm)] transition-colors"
    >
      <NotebookPen className="h-4 w-4 shrink-0" strokeWidth={2.25} />
      {nextUp.cta}
    </Link>
  );
}
