import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatProIntelligenceLabel, PRO_VALUE_BULLETS } from "@/lib/marketing/plans";

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
            {formatProIntelligenceLabel()}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--pf-black)]">
            Unlock the research layer
          </h2>
          <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
            Member gets the workspace. Pro adds market intel and deeper analytics on top of every
            thesis you follow.
          </p>
          <ul className="mt-4 space-y-2">
            {PRO_VALUE_BULLETS.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-[var(--pf-gray-600)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-red)]" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/profile" className="mt-5 inline-block">
            <Button size="sm">View upgrade on profile</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
