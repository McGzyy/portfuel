import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TierComparisonTable } from "@/components/marketing/TierComparisonTable";
import { formatTierPrice, TIER_COMPARISON_ROWS } from "@/lib/marketing/plans";

export function TierComparison() {
  return (
    <section className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] py-16">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <p className="pf-eyebrow">Compare plans</p>
          <h2 className="pf-display mt-3 text-2xl sm:text-3xl">Member vs Pro Intelligence</h2>
          <p className="pf-lead mx-auto mt-3 max-w-lg text-sm">
            Member is the full workspace. Pro adds the research terminal — intel, screeners, and
            deeper analytics on every thesis.
          </p>
        </div>
        <div className="mt-10">
          <TierComparisonTable rows={TIER_COMPARISON_ROWS} />
        </div>
        <div className="mt-8 text-center">
          <Link href="/join">
            <Button size="lg">Start with Member {formatTierPrice("member")} — upgrade anytime</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
