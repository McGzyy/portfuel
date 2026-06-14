"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LifeBuoy, Sparkles } from "lucide-react";
import { ProTodayBriefCard } from "@/components/pro/ProTodayBrief";
import { ResearchPulseCards } from "@/components/pro/ProOverviewIntelStrip";
import {
  RESEARCH_HUB_TABS,
  buildResearchHubHref,
} from "@/lib/dashboard/research-hub";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";
import type { ProTodayBrief } from "@/lib/pro/today-brief";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { briefTitleForHour } from "@/lib/time/greeting";
import { cn } from "@/lib/utils";

/** Unified Pro home surface — daily brief, research pulse, and hub shortcuts. */
export function ProCommandCenter({
  brief,
  battleboard,
  screener,
  className,
}: {
  brief: ProTodayBrief;
  battleboard: EarningsBattleboardSummary;
  screener: CommunityScreenerData;
  className?: string;
}) {
  const [briefTitle, setBriefTitle] = useState("Research terminal");
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
        "pf-pro-command-center overflow-hidden rounded-[var(--pf-radius-lg)] border border-sky-500/25 bg-gradient-to-br from-sky-950/90 via-[#0a0a0a] to-slate-950 shadow-[var(--pf-shadow-lg)]",
        className
      )}
      aria-label="Pro research terminal"
    >
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
              <Sparkles className="h-3 w-3" strokeWidth={2.5} />
              Pro Intelligence
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
              {briefTitle}
            </h2>
            <p className="mt-1 text-sm pf-pro-brief-meta">{today}</p>
          </div>
          <Link
            href={buildResearchHubHref("screener")}
            className="text-xs font-semibold text-sky-300 hover:text-sky-200 hover:underline"
          >
            Open research hub →
          </Link>
        </div>

        <nav
          className="mt-4 flex flex-wrap gap-2"
          aria-label="Research hub shortcuts"
        >
          {RESEARCH_HUB_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={buildResearchHubHref(tab.id)}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-sky-100 transition-colors hover:border-sky-400/40 hover:bg-sky-500/10"
            >
              {tab.label}
            </Link>
          ))}
          <Link
            href="/dashboard/help"
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-sky-100 transition-colors hover:border-sky-400/40 hover:bg-sky-500/10"
          >
            <LifeBuoy className="h-3 w-3" strokeWidth={2.25} />
            Help AI
          </Link>
        </nav>
      </div>

      <ProTodayBriefCard brief={brief} interactive showHeader={false} />

      <div className="border-t border-white/10 bg-black/20 px-4 py-4 sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
          Research pulse
        </p>
        <div className="mt-3">
          <ResearchPulseCards
            battleboard={battleboard}
            screener={screener}
            interactive
            embedded
          />
        </div>
      </div>
    </section>
  );
}
