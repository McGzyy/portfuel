"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Megaphone, Sparkles } from "lucide-react";
import { summarizeJournalHubProgress } from "@/lib/journal/checklist";
import { pickJournalNextUp, type JournalNextUp } from "@/lib/journal/next-up";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import type { WatchlistJournal } from "@/lib/watchlist/journal-types";
import { cn } from "@/lib/utils";

function mergeJournalPlan(item: WatchlistEntry, journal: WatchlistJournal): WatchlistEntry {
  const merged: WatchlistEntry = {
    ...item,
    thesis: journal.thesis,
    has_thesis: Boolean(journal.thesis?.trim()),
    catalysts: journal.catalysts ?? item.catalysts,
    risk_factors: journal.risk_factors ?? item.risk_factors,
    entry_price: journal.entry_price ?? item.entry_price,
    target_price: journal.target_price ?? item.target_price,
    conviction: journal.conviction ?? item.conviction,
    outcome: journal.outcome ?? item.outcome,
    journal_updated_at: journal.journal_updated_at ?? item.journal_updated_at,
  };
  const stats = {
    manualCount: item.journal_progress?.manual_entry_count ?? 0,
    hasAiResearch: item.journal_progress?.has_ai_research ?? false,
  };
  return {
    ...merged,
    journal_progress: summarizeJournalHubProgress(
      {
        thesis: merged.thesis,
        catalysts: merged.catalysts,
        risk_factors: merged.risk_factors,
        entry_price: merged.entry_price,
        target_price: merged.target_price,
      },
      stats
    ),
  };
}

async function hydrateSymbolFromJournal(
  items: WatchlistEntry[],
  symbol: string
): Promise<WatchlistEntry[]> {
  try {
    const res = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}/journal`, {
      cache: "no-store",
    });
    if (!res.ok) return items;
    const data = (await res.json()) as { journal?: WatchlistJournal };
    if (!data.journal?.thesis?.trim()) return items;
    return items.map((i) =>
      i.symbol === symbol ? mergeJournalPlan(i, data.journal!) : i
    );
  } catch {
    return items;
  }
}

export function JournalContinueCard({ nextUp: initialNextUp }: { nextUp: JournalNextUp }) {
  const [nextUp, setNextUp] = useState(initialNextUp);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/watchlist", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items?: WatchlistEntry[] };
        if (!data.items?.length || cancelled) return;

        let items = data.items;
        const firstPass = pickJournalNextUp(items);
        if (firstPass?.reason === "draft_thesis") {
          items = await hydrateSymbolFromJournal(items, firstPass.symbol);
        }

        const fresh = pickJournalNextUp(items);
        if (!cancelled && fresh) setNextUp(fresh);
      } catch {
        /* keep SSR snapshot */
      }
    }

    void refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  const isPublish = nextUp.reason === "publish_call";
  const isPosture = nextUp.reason === "manage_posture";

  return (
    <Link
      href={nextUp.href}
      className={cn(
        "group block rounded-[var(--pf-radius-lg)] border px-5 py-4 shadow-[var(--pf-shadow-sm)] transition-colors",
        isPublish ? "pf-ready-publish-nudge" : isPosture ? "pf-posture-nudge" : "pf-continue-card"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p
            className={cn(
              "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
              isPublish
                ? "text-emerald-800"
                : isPosture
                  ? "text-amber-800"
                  : "text-[var(--pf-red)]"
            )}
          >
            {isPublish ? (
              <Megaphone className="h-3.5 w-3.5" strokeWidth={2.25} />
            ) : (
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
            {isPublish
              ? "Ready to publish"
              : isPosture
                ? "Book posture"
                : "Up next in your journal"}
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-[var(--foreground)]">{nextUp.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--pf-gray-600)]">{nextUp.detail}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
            isPublish
              ? "bg-emerald-700 text-white group-hover:bg-emerald-800"
              : "pf-accent-btn"
          )}
        >
          {nextUp.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
    </Link>
  );
}
