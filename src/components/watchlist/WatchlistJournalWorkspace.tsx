"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LineChart, Megaphone, NotebookPen } from "lucide-react";
import { JournalResearchChecklistStrip } from "@/components/journal/JournalResearchChecklistStrip";
import { JournalResearchPanel } from "@/components/journal/JournalResearchPanel";
import { ResearchPipeline } from "@/components/journal/ResearchPipeline";
import { COPY } from "@/lib/copy";
import { buildJournalResearchChecklist } from "@/lib/journal/checklist";
import { journalHubPath, journalSymbolPath } from "@/lib/journal/paths";
import { TickerChartSection } from "@/components/charts/TickerChartSection";
import { WatchlistJournalPlanForm } from "@/components/watchlist/WatchlistJournalPlanForm";
import { WatchlistJournalStats } from "@/components/watchlist/WatchlistJournalStats";
import { WatchlistJournalTimeline } from "@/components/watchlist/WatchlistJournalTimeline";
import { buildJournalPriceLines, buildJournalScenarioPriceLines } from "@/lib/charts/price-lines";
import { WatchlistJournalScenarioStrip } from "@/components/watchlist/WatchlistJournalScenarioStrip";
import type { CandlePoint, ChartMarker } from "@/lib/charts/types";
import type { TickerIntel } from "@/lib/market/ticker-intel";
import { buildJournalEntryMarkers } from "@/lib/watchlist/journal-markers";
import type { WatchlistJournal, WatchlistJournalEntry } from "@/lib/watchlist/journal-types";
import type { JournalPrefillEntry } from "@/lib/journal/paths";

export function WatchlistJournalWorkspace({
  journal: initialJournal,
  entries: initialEntries,
  intel,
  publishUrl,
  proUnlocked,
  setupMode,
  prefillEntry,
}: {
  journal: WatchlistJournal;
  entries: WatchlistJournalEntry[];
  intel: TickerIntel;
  publishUrl: string;
  proUnlocked: boolean;
  setupMode?: boolean;
  prefillEntry?: JournalPrefillEntry;
}) {
  const [journal, setJournal] = useState(initialJournal);
  const [entries, setEntries] = useState(initialEntries);
  const priceLines = useMemo(
    () => [...buildJournalPriceLines(journal), ...buildJournalScenarioPriceLines(journal)],
    [journal]
  );

  const candles: CandlePoint[] = intel.candles.map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  const markers = useMemo(() => {
    const journalMarkers = buildJournalEntryMarkers(entries);
    const communityMarkers: ChartMarker[] = intel.markers.map((m) => ({
      time: m.time,
      price: m.price,
      label: m.label,
      color: m.color,
      kind: m.kind,
      callId: m.callId,
    }));
    return [...journalMarkers, ...communityMarkers];
  }, [entries, intel.markers]);

  const journalMarkerCount = useMemo(
    () => entries.filter((e) => e.marker_price != null && e.marker_price > 0).length,
    [entries]
  );

  const checklist = useMemo(
    () => buildJournalResearchChecklist(journal, entries),
    [journal, entries]
  );

  function handleEntryAdded(entry: WatchlistJournalEntry) {
    setEntries((prev) => [...prev, entry]);
  }

  const scrollToHash = useCallback(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#journal-")) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [scrollToHash]);

  return (
    <div className="space-y-6">
      <ResearchPipeline
        current={setupMode ? "research" : "log"}
        logHref={journalSymbolPath(journal.symbol, { section: "entries" })}
      />

      <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Research · Journal
            </p>
            <h1 className="mt-1.5 font-mono text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-[1.75rem]">
              ${journal.symbol}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-500)]">
              {intel.companyName !== journal.symbol ? intel.companyName : "Your research notebook"}{" "}
              — thesis, catalysts, plan levels, and AI research stay private until you publish a
              call.
            </p>
            {setupMode ? (
              <p className="mt-2 text-xs font-semibold text-[var(--pf-red)]">
                New watchlist symbol — add your thesis and plan below. Use{" "}
                <span className="text-[var(--pf-black)]">{COPY.journalAddEntry}</span> on the
                timeline for price-action notes (not a community call).
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              <Link
                href={journalHubPath()}
                className="inline-flex items-center gap-1 text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Journal
              </Link>
              <Link
                href="/dashboard/watchlist"
                className="text-[var(--pf-gray-600)] hover:text-[var(--pf-black)] hover:underline"
              >
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
          {setupMode ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-4 py-2.5 text-sm font-semibold text-[var(--pf-gray-600)]">
              <NotebookPen className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              {COPY.journalSavePlan} first
            </div>
          ) : (
            <Link
              href={publishUrl}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--pf-red)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)]"
            >
              <Megaphone className="h-4 w-4" strokeWidth={2.25} />
              {COPY.publishFromJournal}
            </Link>
          )}
        </div>
      </header>

      <div id="journal-checklist">
        <JournalResearchChecklistStrip
          checklist={checklist}
          publishUrl={publishUrl}
          setupMode={setupMode}
        />
      </div>

      {setupMode ? (
        <div id="journal-plan">
          <WatchlistJournalPlanForm
            symbol={journal.symbol}
            initial={journal}
            onSaved={(next) => setJournal(next)}
          />
        </div>
      ) : null}

      <WatchlistJournalStats intel={intel} />

      <div className="grid gap-6 lg:grid-cols-2">
        {!setupMode ? (
          <div id="journal-plan">
            <WatchlistJournalPlanForm
              symbol={journal.symbol}
              initial={journal}
              onSaved={(next) => setJournal(next)}
            />
          </div>
        ) : null}
        <div className={setupMode ? "lg:col-span-2" : undefined} id="journal-entries">
          <WatchlistJournalTimeline
            symbol={journal.symbol}
            entries={entries}
            onEntryAdded={handleEntryAdded}
            prefillEntryType={prefillEntry}
          />
        </div>
      </div>

      <div id="journal-research">
        <JournalResearchPanel symbol={journal.symbol} onEntrySaved={handleEntryAdded} />
      </div>

      <WatchlistJournalScenarioStrip journal={journal} />

      <div id="journal-chart">
        <TickerChartSection
        symbol={journal.symbol}
        initialCandles={candles}
        markers={markers}
        priceLines={priceLines}
        proUnlocked={proUnlocked}
        title="Private chart"
        subtitle="Indigo dots mark each journal entry at that day's price — click a dot to jump to the note."
        journalMarkerCount={journalMarkerCount}
      />
      </div>
    </div>
  );
}
