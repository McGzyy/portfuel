"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { briefTitleForHour } from "@/lib/time/greeting";
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

export function ProTodayBriefCard({
  brief,
  interactive = true,
  showHeader = true,
}: {
  brief: ProTodayBrief;
  interactive?: boolean;
  /** When false, omit the card header (used inside ProCommandCenter). */
  showHeader?: boolean;
}) {
  const [briefTitle, setBriefTitle] = useState("Your daily brief");
  const [today, setToday] = useState("");

  useEffect(() => {
    const now = new Date();
    setBriefTitle(briefTitleForHour(now.getHours()));
    setToday(
      now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    );
  }, []);

  return (
    <section
      className={cn(
        showHeader &&
          "pf-pro-brief pf-keep-blue overflow-hidden rounded-[var(--pf-radius-lg)] border border-sky-500/30 bg-gradient-to-br from-sky-950 via-[#0a0a0a] to-slate-950 shadow-[var(--pf-shadow-lg)]"
      )}
      aria-label={showHeader ? "Pro Today brief" : undefined}
    >
      {showHeader ? (
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                Pro Today
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
                {briefTitle}
              </h2>
              <p className="mt-1 text-sm pf-pro-brief-meta">{today}</p>
            </div>
            {interactive ? (
              <Link
                href={buildResearchHubHref("screener")}
                className="text-xs font-semibold text-sky-300 hover:text-sky-200 hover:underline"
              >
                Research tools →
              </Link>
            ) : (
              <span className="text-xs font-semibold text-sky-300/60">Research tools</span>
            )}
          </div>
        </div>
      ) : null}

      <ul className={cn("divide-y divide-white/10", !showHeader && "border-t border-white/10")}>
        {brief.rows.map((row) => {
          const Icon = rowIcon(row.accent);
          const inner = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-200">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">{row.title}</span>
                <span className="mt-1 block text-xs leading-relaxed pf-pro-brief-detail">
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
        Pro adds a personalized morning brief — desk note, earnings, screener, and your live positions.
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
            className="pf-chip-action px-2.5 py-0.5 text-xs font-medium"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
