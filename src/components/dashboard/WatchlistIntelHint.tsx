import Link from "next/link";
import { BookOpen } from "lucide-react";

export function WatchlistIntelHint() {
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--pf-red)] shadow-[var(--pf-shadow-sm)]">
        <BookOpen className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm text-[var(--pf-gray-600)]">
        <p className="font-semibold text-[var(--pf-gray-800)]">Watchlist tracks symbols — Journal holds your research</p>
        <p className="mt-0.5 leading-relaxed">
          Add symbols here for alerts and quick intel. Open{" "}
          <Link href="/dashboard/journal" className="font-semibold text-[var(--pf-red)] hover:underline">
            Journal
          </Link>{" "}
          for thesis, plan levels, AI research review, and private entries. Publish a call when
          you&apos;re ready for the community to see it.
        </p>
      </div>
    </div>
  );
}
