import Link from "next/link";
import { BookOpen } from "lucide-react";

export function WatchlistIntelHint() {
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--pf-red)] shadow-[var(--pf-shadow-sm)]">
        <BookOpen className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm text-[var(--pf-gray-600)]">
        <p className="font-semibold text-[var(--pf-gray-800)]">Journal first, publish when ready</p>
        <p className="mt-0.5 leading-relaxed">
          Open <strong className="font-semibold text-[var(--pf-gray-800)]">Journal</strong> on any row
          for a private thesis, entry/stop/target on your chart, and timestamped updates. Use{" "}
          <strong className="font-semibold text-[var(--pf-gray-800)]">Publish call</strong> when you
          want the community to see it.
        </p>
        <p className="mt-2 text-xs">
          <Link href="/dashboard/feed" className="font-semibold text-[var(--pf-red)] hover:underline">
            Member feed
          </Link>
          {" · "}
          Community intel on each symbol via the Intel link
        </p>
      </div>
    </div>
  );
}
