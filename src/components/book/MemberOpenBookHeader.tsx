import Link from "next/link";
import { WorkspaceNewCallAction } from "@/components/dashboard/WorkspacePageHeader";
import type { MemberOpenBookSummary } from "@/lib/calls/member-book";
import { quotesRefreshLabel } from "@/lib/market/quote-cadence";
import { formatPct } from "@/lib/utils";

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative";
}) {
  const valueClass =
    accent === "positive"
      ? "text-emerald-600"
      : accent === "negative"
        ? "text-rose-600"
        : "text-[var(--pf-black)]";

  return (
    <div className="rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

export function MemberOpenBookHeader({
  summary,
  username,
  isPro = false,
}: {
  summary: MemberOpenBookSummary;
  username: string;
  isPro?: boolean;
}) {
  const avgAccent =
    summary.avgReturnPct == null
      ? undefined
      : summary.avgReturnPct >= 0
        ? ("positive" as const)
        : ("negative" as const);

  const subtitle =
    summary.openCount > 0
      ? `${summary.openCount} live thesis${summary.openCount === 1 ? "" : "es"} across ${summary.uniqueSymbols} symbol${summary.uniqueSymbols === 1 ? "" : "s"} — ${quotesRefreshLabel({ isPro }).replace(/^./, (c) => c.toLowerCase())}.`
      : "Your published calls with open entry, target, and stop appear here as a portfolio view — not broker sync.";

  return (
    <header className="space-y-4">
      <div className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Workspace · Your book
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
              Open book
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">{subtitle}</p>
            <Link
              href={`/member/${username}`}
              className="mt-3 inline-block text-xs font-semibold text-[var(--pf-red)] hover:underline"
            >
              Public track record →
            </Link>
          </div>
          <WorkspaceNewCallAction />
        </div>
      </div>

      {summary.openCount > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Open calls" value={String(summary.openCount)} />
          <Stat label="Symbols" value={String(summary.uniqueSymbols)} />
          <Stat
            label="Avg return"
            value={summary.avgReturnPct != null ? formatPct(summary.avgReturnPct) : "—"}
            accent={avgAccent}
          />
          <Stat
            label="Long / short"
            value={`${summary.longCount} / ${summary.shortCount}`}
          />
        </div>
      ) : null}
    </header>
  );
}
