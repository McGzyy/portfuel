import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROWS: { feature: string; member: boolean | string; pro: boolean | string }[] = [
  { feature: "Member feed, votes & comments", member: true, pro: true },
  { feature: "Ticker charts with call markers", member: true, pro: true },
  { feature: "Watchlist & follow top callers", member: true, pro: true },
  { feature: "Fueled desk (house research)", member: true, pro: true },
  { feature: "In-app + email alerts", member: true, pro: true },
  { feature: "Published calls per week", member: "2", pro: "6" },
  { feature: "News, earnings & SEC on tickers", member: false, pro: true },
  { feature: "Community screener & CSV export", member: false, pro: true },
  { feature: "Ticker compare (2–3 symbols)", member: false, pro: true },
  { feature: "Watchlist move & earnings alerts", member: false, pro: true },
  { feature: "Return distribution on profile", member: false, pro: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-[var(--pf-red)]" strokeWidth={2.5} />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-[var(--pf-gray-300)]" strokeWidth={2} />;
  }
  return <span className="text-sm font-semibold tabular-nums text-[var(--pf-black)]">{value}</span>;
}

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
        <div className="mt-10 overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--pf-border)] bg-[var(--pf-gray-50)] text-xs font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3 text-center">Member $79</th>
                <th className="px-4 py-3 text-center text-[var(--pf-red)]">Pro $129</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-[var(--pf-border)] last:border-0">
                  <td className="px-4 py-3 text-[var(--pf-gray-700)]">{row.feature}</td>
                  <td className="px-4 py-3 text-center">
                    <Cell value={row.member} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Cell value={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 text-center">
          <Link href="/join">
            <Button size="lg">Start with Member — upgrade anytime</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
