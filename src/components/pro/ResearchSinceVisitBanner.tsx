import Link from "next/link";
import { buildFeedHref } from "@/lib/dashboard/nav";

export function ResearchSinceVisitBanner({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <div className="rounded-[var(--pf-radius-lg)] border border-sky-200 bg-sky-50/80 px-4 py-3 sm:px-5">
      <p className="text-sm text-[var(--pf-gray-700)]">
        <span className="font-semibold text-sky-900">
          {count} new community call{count === 1 ? "" : "s"}
        </span>{" "}
        since your last research session — screener and earnings may reflect fresh theses.
      </p>
      <Link
        href={buildFeedHref({ filter: "following" })}
        className="mt-2 inline-block text-xs font-semibold text-sky-800 hover:underline"
      >
        View following feed →
      </Link>
    </div>
  );
}
