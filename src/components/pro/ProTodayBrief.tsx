import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Coins,
  Flame,
  ScanSearch,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { ProTodayBrief, ProTodayBriefRow } from "@/lib/pro/today-brief";
import { cn } from "@/lib/utils";

function rowIcon(accent: ProTodayBriefRow["accent"]) {
  switch (accent) {
    case "desk":
      return Flame;
    case "earnings":
      return Calendar;
    case "screener":
      return ScanSearch;
    case "book":
      return TrendingUp;
    case "journal":
      return BookOpen;
    case "crypto":
      return Coins;
    default:
      return Sparkles;
  }
}

function ProTodayBriefCard({ brief, interactive = true }: { brief: ProTodayBrief; interactive?: boolean }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <section
      className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-indigo-200/80 bg-gradient-to-br from-indigo-950 via-[#0f1419] to-[#1a1520] shadow-[var(--pf-shadow-lg)]"
      aria-label="Pro Today brief"
    >
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
              Pro Today
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
              Your morning brief
            </h2>
            <p className="mt-1 text-sm text-slate-400">{today}</p>
          </div>
          {interactive ? (
            <Link
              href={buildResearchHubHref("screener")}
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 hover:underline"
            >
              Research tools →
            </Link>
          ) : (
            <span className="text-xs font-semibold text-indigo-300/60">Research tools</span>
          )}
        </div>
      </div>

      <ul className="divide-y divide-white/10">
        {brief.rows.map((row) => {
          const Icon = rowIcon(row.accent);
          const inner = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-indigo-200">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">{row.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                  {row.detail}
                </span>
              </span>
            </>
          );
          const className = "flex gap-4 px-5 py-4 transition-colors sm:px-6";

          return (
            <li key={row.id}>
              {interactive ? (
                <Link href={row.href} className={cn(className, "hover:bg-white/5")}>
                  {inner}
                </Link>
              ) : (
                <div className={className}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProTodayBrief({
  brief,
  locked,
  proGateCta = "upgrade",
}: {
  brief: ProTodayBrief;
  locked?: boolean;
  proGateCta?: ProGateCta;
}) {
  const card = <ProTodayBriefCard brief={brief} interactive={!locked} />;

  return (
    <ProIntelligenceGate
      locked={Boolean(locked)}
      cta={proGateCta}
      variant="preview"
      title="Pro Today brief"
      description="One morning screen: desk note, your watchlist earnings, screener movers, open calls, and journal ideas ready to publish."
      teaser={locked ? <ProTodayBriefTeaser brief={brief} /> : undefined}
      className={cn(locked && "rounded-[var(--pf-radius-lg)]")}
    >
      {card}
    </ProIntelligenceGate>
  );
}

function ProTodayBriefTeaser({ brief }: { brief: ProTodayBrief }) {
  const pills = brief.rows.slice(0, 4).map((row) => row.title);

  if (pills.length === 0) {
    return (
      <p className="text-sm text-[var(--pf-gray-600)]">
        Pro adds a personalized morning brief — desk note, earnings, screener, and your open book.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <span className="inline-block rounded-full bg-[var(--pf-red-muted)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--pf-red)]">
        Pro preview
      </span>
      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <span
            key={p}
            className="rounded-full border border-[var(--pf-border)] bg-white px-2.5 py-0.5 text-xs font-medium text-[var(--pf-gray-700)]"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
