import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTierPrice } from "@/lib/marketing/plans";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";
import { buildProMembershipHook } from "@/lib/pro/upgrade-prompt";

const PRO_HIGHLIGHTS = [
  "Full ticker intel (news, earnings, SEC)",
  "Intraday charts & screener",
  "6 calls per week + AI thesis tools",
] as const;

export function ProMembershipStrip({
  locked,
  watchlistSymbols = [],
}: {
  locked: boolean;
  watchlistSymbols?: string[];
}) {
  const personalizedHook = buildProMembershipHook(watchlistSymbols);

  if (locked) {
    return (
      <div className="pf-pro-strip pf-pro-strip-locked">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--pf-red)] text-white">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--pf-black)]">
              Pro Intelligence — built for serious callers
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-600)]">
              {personalizedHook ??
                `Everything in membership, plus research depth, more weekly publishes, and AI on your book — ${formatTierPrice("pro")}.`}
            </p>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {PRO_HIGHLIGHTS.map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--pf-gray-700)]"
                >
                  <Check className="h-3 w-3 shrink-0 text-[var(--pf-red)]" strokeWidth={3} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link href="/pricing" className="shrink-0 self-center">
          <Button size="sm">View plans</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pf-pro-strip pf-pro-strip-active">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/15 text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--pf-black)]">Pro Intelligence active</p>
          <p className="text-xs text-[var(--pf-gray-600)]">
            Ticker intel, screener, compare, intraday charts, and expanded AI quota are unlocked.
          </p>
        </div>
      </div>
      <Link
        href={buildResearchHubHref("screener")}
        className="shrink-0 text-xs font-semibold text-[var(--pf-gray-700)] hover:text-[var(--pf-black)] hover:underline"
      >
        Open screener →
      </Link>
    </div>
  );
}
