"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LineChart, Megaphone } from "lucide-react";
import { TickerChartSection } from "@/components/charts/TickerChartSection";
import { WatchlistJournalPlanForm } from "@/components/watchlist/WatchlistJournalPlanForm";
import { WatchlistJournalStats } from "@/components/watchlist/WatchlistJournalStats";
import { WatchlistJournalTimeline } from "@/components/watchlist/WatchlistJournalTimeline";
import { buildJournalPriceLines } from "@/lib/charts/price-lines";
import type { CandlePoint, ChartMarker } from "@/lib/charts/types";
import type { TickerIntel } from "@/lib/market/ticker-intel";
import type { WatchlistJournal, WatchlistJournalEntry } from "@/lib/watchlist/journal-types";

export function WatchlistJournalWorkspace({
  journal: initialJournal,
  entries: initialEntries,
  intel,
  publishUrl,
  proUnlocked,
  setupMode,
}: {
  journal: WatchlistJournal;
  entries: WatchlistJournalEntry[];
  intel: TickerIntel;
  publishUrl: string;
  proUnlocked: boolean;
  setupMode?: boolean;
}) {
  const [journal, setJournal] = useState(initialJournal);
  const priceLines = useMemo(() => buildJournalPriceLines(journal), [journal]);

  const candles: CandlePoint[] = intel.candles.map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  const markers: ChartMarker[] = intel.markers.map((m) => ({
    time: m.time,
    price: m.price,
    label: m.label,
    color: m.color,
  }));

  return (
    <div className="space-y-6">
      <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Private journal · Watchlist
            </p>
            <h1 className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
              ${journal.symbol}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
              {intel.companyName !== journal.symbol ? intel.companyName : "Your research notebook"}{" "}
              — plan, chart levels, and updates stay private until you publish a call.
            </p>
            {setupMode ? (
              <p className="mt-2 text-xs font-semibold text-[var(--pf-red)]">
                Start with your thesis — why are you watching this symbol?
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              <Link
                href="/dashboard/watchlist"
                className="inline-flex items-center gap-1 text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Watchlist
              </Link>
              <Link
                href={`/ticker/${journal.symbol}`}
                className="inline-flex items-center gap-1 text-[var(--pf-red)] hover:underline"
              >
                <LineChart className="h-3.5 w-3.5" />
                Community intel
              </Link>
            </div>
          </div>
          <Link
            href={publishUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--pf-red)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)]"
          >
            <Megaphone className="h-4 w-4" strokeWidth={2.25} />
            Turn into a call
          </Link>
        </div>
      </header>

      <WatchlistJournalStats intel={intel} />

      <TickerChartSection
        symbol={journal.symbol}
        initialCandles={candles}
        markers={markers}
        priceLines={priceLines}
        proUnlocked={proUnlocked}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <WatchlistJournalPlanForm
          symbol={journal.symbol}
          initial={journal}
          onSaved={(next) => setJournal(next)}
        />
        <WatchlistJournalTimeline
          symbol={journal.symbol}
          initialEntries={initialEntries}
          onEntryAdded={() => {
            /* timeline manages local state */
          }}
        />
      </div>
    </div>
  );
}
