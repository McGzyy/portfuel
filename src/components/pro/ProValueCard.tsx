import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRO_FEATURES = [
  "News, earnings & SEC filings on every equity ticker",
  "Pro feed & rankings analytics (target progress, win-rate depth)",
  "6 published calls per week (vs 2 on Member)",
  "Watchlist move alerts (±5% since you added a symbol)",
  "Earnings calendar for your watchlist (next 14 days)",
  "Target progress leaders on the member feed",
  "Community screener — most called symbols & best 30-day returns (CSV export)",
] as const;

export function ProValueCard({ className }: { className?: string }) {
  return (
    <section
      className={`overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-red)]/25 bg-gradient-to-br from-[var(--pf-red-muted)] via-white to-white p-5 shadow-[var(--pf-shadow-md)] ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--pf-red)] text-white">
          <Sparkles className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-red)]">
            Pro Intelligence · $129/mo
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--pf-black)]">
            Unlock the research layer
          </h2>
          <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
            Member gets the workspace. Pro adds market intel and deeper analytics on top of every
            thesis you follow.
          </p>
          <ul className="mt-4 space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-[var(--pf-gray-700)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/profile" className="mt-5 inline-block">
            <Button size="sm">Upgrade to Pro</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
