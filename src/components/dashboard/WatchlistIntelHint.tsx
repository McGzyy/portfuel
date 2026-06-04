import Link from "next/link";
import { LineChart } from "lucide-react";

export function WatchlistIntelHint() {
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--pf-red)] shadow-[var(--pf-shadow-sm)]">
        <LineChart className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm text-[var(--pf-gray-600)]">
        <p className="font-semibold text-[var(--pf-gray-800)]">Each symbol opens full ticker intel</p>
        <p className="mt-0.5 leading-relaxed">
          Tap a row for live chart, entry/target lines, community calls, desk exposure, and Pro research
          previews. Use the lookup bar above for any symbol not on your list yet.
        </p>
        <p className="mt-2 text-xs">
          <Link href="/dashboard/feed" className="font-semibold text-[var(--pf-red)] hover:underline">
            Member feed
          </Link>
          {" · "}
          <Link href="/dashboard/rankings" className="font-semibold text-[var(--pf-red)] hover:underline">
            Rankings
          </Link>
        </p>
      </div>
    </div>
  );
}
