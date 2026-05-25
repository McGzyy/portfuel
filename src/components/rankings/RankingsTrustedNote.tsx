import { Badge } from "@/components/ui/badge";

export function RankingsTrustedNote() {
  return (
    <div className="mt-6 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-3 text-sm text-[var(--pf-gray-600)]">
      <p className="flex flex-wrap items-center gap-2 font-medium text-[var(--pf-gray-700)]">
        <Badge variant="trusted">Trusted</Badge>
        Verified track record
      </p>
      <p className="mt-1.5 leading-relaxed">
        Trusted members are flagged by PortFuel after consistent, attributable performance on
        published calls. Rank score blends win rate, average return, and activity — follow them
        from their profile to get alerts when they publish.
      </p>
    </div>
  );
}
