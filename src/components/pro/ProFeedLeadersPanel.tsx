import Link from "next/link";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { CallCardData } from "@/components/calls/CallCard";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { formatPct } from "@/lib/utils";

export function ProFeedLeadersPanel({
  calls,
  locked,
  proGateCta,
}: {
  calls: CallCardData[];
  locked: boolean;
  proGateCta: ProGateCta;
}) {
  const leaders = [...calls]
    .filter((c) => c.target_progress != null)
    .sort((a, b) => (b.target_progress ?? 0) - (a.target_progress ?? 0))
    .slice(0, 6);

  const body = (
    <div className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Pro · target progress leaders
      </p>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        Calls closest to their stated targets in this feed view.
      </p>
      {leaders.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">No target progress data in this view yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {leaders.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2"
            >
              <div className="min-w-0">
                <Link
                  href={`/ticker/${c.symbol}`}
                  className="font-mono text-sm font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                >
                  {c.symbol}
                </Link>
                <p className="truncate text-xs text-[var(--pf-gray-500)]">
                  @{c.username ?? c.pin} · {formatPct(c.return_pct)} return
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-600">
                {Math.round(c.target_progress ?? 0)}% to target
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <ProIntelligenceGate
      locked={locked}
      cta={proGateCta}
      title="Pro feed analytics"
      description="Target progress leaders and desk-level stats — Pro Intelligence."
      compact
    >
      {body}
    </ProIntelligenceGate>
  );
}
