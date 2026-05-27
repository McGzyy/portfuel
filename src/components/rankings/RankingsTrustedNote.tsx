import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function RankingsTrustedNote() {
  return (
    <div className="mt-6 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-sm text-[var(--pf-gray-600)]">
      <p className="flex flex-wrap items-center gap-2 font-medium text-[var(--pf-gray-700)]">
        <Badge variant="trusted">Trusted</Badge>
        Verified track record
      </p>
      <p className="mt-1.5 leading-relaxed">
        Trusted members are flagged by PortFuel after consistent, attributable performance on published
        calls. Follow them from their profile to get alerts when they publish new theses.
      </p>

      <details className="group mt-3">
        <summary className="cursor-pointer list-none text-xs font-semibold text-[var(--pf-red)] marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">How rank score works →</span>
          <span className="hidden group-open:inline">How rank score works ↑</span>
        </summary>
        <div className="mt-3 space-y-2 border-t border-[var(--pf-border)] pt-3 text-xs leading-relaxed text-[var(--pf-gray-600)]">
          <p>
            <strong className="text-[var(--pf-gray-800)]">Rank score</strong> is the sum of score points
            across a member&apos;s calls. Each call earns points from live return % (with a 90-day decay
            so recent performance weighs more) plus a small boost from community votes.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>Return drives most of the score — winners climb, laggards fade as quotes update.</li>
            <li>Vote score adds up to ±2.5 points per call (capped contribution).</li>
            <li>Older calls contribute less after ~90 days via time decay.</li>
          </ul>
          <p>
            The bar beside each row shows score relative to the current #1 on this board — not a fixed
            cap. Scores refresh when market quotes update closed and open calls.
          </p>
          <p className="text-[var(--pf-gray-500)]">
            Trusted status is separate from rank: it reflects editorial review of track record quality,
            not a single week&apos;s score spike.
          </p>
        </div>
      </details>

      <p className="mt-3 text-xs text-[var(--pf-gray-500)]">
        New here?{" "}
        <Link href="/dashboard/feed" className="font-semibold text-[var(--pf-red)] hover:underline">
          Browse the member feed
        </Link>{" "}
        or open a profile from the table to follow.
      </p>
    </div>
  );
}
