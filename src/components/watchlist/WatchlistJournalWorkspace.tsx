"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LineChart, Megaphone, NotebookPen } from "lucide-react";
import { JournalExportButton } from "@/components/journal/JournalExportButton";
import { JournalResearchChecklistStrip } from "@/components/journal/JournalResearchChecklistStrip";
import { JournalResearchPanel } from "@/components/journal/JournalResearchPanel";
import { ResearchPipeline } from "@/components/journal/ResearchPipeline";
import { COPY } from "@/lib/copy";
import { buildJournalResearchChecklist } from "@/lib/journal/checklist";
import { RemoveFromWatchlistButton } from "@/components/watchlist/RemoveFromWatchlistButton";
import { journalHubPath, journalSymbolPath } from "@/lib/journal/paths";
import { JournalPrivateChart } from "@/components/watchlist/JournalPrivateChart";
import { WatchlistJournalScenarioStrip } from "@/components/watchlist/WatchlistJournalScenarioStrip";
import { WatchlistJournalPlanForm } from "@/components/watchlist/WatchlistJournalPlanForm";
import { WatchlistJournalStats } from "@/components/watchlist/WatchlistJournalStats";
import { WatchlistJournalTimeline } from "@/components/watchlist/WatchlistJournalTimeline";
import type { CandlePoint, ChartMarker } from "@/lib/charts/types";
import type { TickerIntel } from "@/lib/market/ticker-intel";
import { buildJournalEntryMarkers } from "@/lib/watchlist/journal-markers";
import type { WatchlistJournal, WatchlistJournalEntry } from "@/lib/watchlist/journal-types";
import { WatchlistJournalEditLog } from "@/components/watchlist/WatchlistJournalEditLog";
import { PositionIntentBadge } from "@/components/watchlist/PositionIntentBadge";
import type { JournalPlanRevision } from "@/lib/watchlist/journal-revisions";
import type { JournalPrefillEntry } from "@/lib/journal/paths";

export function WatchlistJournalWorkspace({
  journal: initialJournal,
  entries: initialEntries,
  revisions: initialRevisions,
  intel,
  publishUrl,
  proUnlocked,
  setupMode,
  prefillEntry,
  hasOpenCall = false,
}: {
  journal: WatchlistJournal;
  entries: WatchlistJournalEntry[];
  revisions?: JournalPlanRevision[];
  intel: TickerIntel;
  publishUrl: string;
  proUnlocked: boolean;
  setupMode?: boolean;
  prefillEntry?: JournalPrefillEntry;
  hasOpenCall?: boolean;
}) {
  const [journal, setJournal] = useState(initialJournal);
  const [entries, setEntries] = useState(initialEntries);
  const [revisions, setRevisions] = useState(initialRevisions ?? []);

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
    () => buildJournalResearchChecklist(journal, entries, { hasOpenCall }),
    [journal, entries, hasOpenCall]
  );

  function handleEntryAdded(entry: WatchlistJournalEntry) {
    setEntries((prev) => [...prev, entry]);
  }

  async function refreshRevisions() {
    try {
      const res = await fetch(
        `/api/watchlist/${encodeURIComponent(journal.symbol)}/journal/revisions`
      );
      if (!res.ok) return;
      const data = await res.json();
      setRevisions((data.revisions ?? []) as JournalPlanRevision[]);
    } catch {
      /* ignore */
    }
  }

  function handlePlanSaved(next: WatchlistJournal) {
    setJournal(next);
    void refreshRevisions();
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
    <div className="space-y-8 lg:space-y-10">
      <ResearchPipeline
        current={
          hasOpenCall ? "log" : checklist.readyToPublish ? "publish" : setupMode ? "research" : "log"
        }
        logHref={journalSymbolPath(journal.symbol, { section: "entries" })}
        publishHref={checklist.readyToPublish ? publishUrl : undefined}
      />

      <header className="pf-overview-command rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] px-5 py-5 shadow-[var(--pf-shadow-sm)] sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={journalHubPath()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--pf-gray-600)] transition-colors hover:text-[var(--pf-black)]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            Journal
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <JournalExportButton symbol={journal.symbol} proUnlocked={proUnlocked} />
            <RemoveFromWatchlistButton
              symbol={journal.symbol}
              variant="icon"
              redirectTo={journalHubPath()}
              className="rounded-lg border border-transparent p-2 hover:border-[var(--pf-border)] hover:bg-[var(--pf-gray-50)]"
            />
            {setupMode ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2 text-xs font-semibold text-[var(--pf-gray-600)]">
                <NotebookPen className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                Save plan first
              </span>
            ) : hasOpenCall ? (
              <Link
                href={`/ticker/${encodeURIComponent(journal.symbol)}#calls`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100 sm:text-sm sm:px-3.5 sm:py-2.5"
              >
                <Megaphone className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.25} />
                Call live · View
              </Link>
            ) : checklist.readyToPublish ? (
              <Link
                href={publishUrl}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--pf-red)] px-3.5 py-2 text-xs font-semibold text-white shadow-[var(--pf-shadow-sm)] transition-colors hover:bg-[var(--pf-red-hover)] sm:text-sm sm:px-4 sm:py-2.5"
              >
                <Megaphone className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.25} />
                {COPY.publishFromJournal}
              </Link>
            ) : (
              <Link
                href="#journal-checklist"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] px-3 py-2 text-xs font-semibold text-[var(--pf-gray-600)] transition-colors hover:border-[var(--pf-gray-300)] hover:text-[var(--pf-black)] sm:text-sm sm:px-3.5 sm:py-2.5"
              >
                <Megaphone className="h-3.5 w-3.5 shrink-0 opacity-60" strokeWidth={2.25} />
                {checklist.requiredCompleted}/{checklist.requiredTotal} · Publish when ready
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-[var(--pf-border)] pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
            Research · Journal
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-[var(--pf-black)] sm:text-3xl">
              ${journal.symbol}
            </h1>
            {intel.companyName !== journal.symbol ? (
              <span className="text-sm font-medium text-[var(--pf-gray-500)] sm:text-base">
                {intel.companyName}
              </span>
            ) : null}
            {journal.position_intent && journal.position_intent !== "researching" ? (
              <PositionIntentBadge intent={journal.position_intent} />
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--pf-gray-500)]">
            Thesis, catalysts, and plan levels stay private until you publish a call.
          </p>
          {setupMode ? (
            <p className="mt-2 text-xs font-semibold text-[var(--pf-red)]">
              New watchlist symbol — draft your thesis below, then use{" "}
              <span className="text-[var(--pf-black)]">{COPY.journalAddEntry}</span> on the timeline
              for price-action notes.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
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
              <LineChart className="h-3.5 w-3.5" strokeWidth={2.25} />
              Community intel
            </Link>
          </div>
        </div>
      </header>

      <div id="journal-checklist">
        <JournalResearchChecklistStrip
          symbol={journal.symbol}
          checklist={checklist}
          publishUrl={publishUrl}
          setupMode={setupMode}
          hasOpenCall={hasOpenCall}
        />
      </div>

      <JournalPrivateChart
        symbol={journal.symbol}
        journal={journal}
        candles={candles}
        assetClass={journal.asset_class}
        markers={markers}
        proUnlocked={proUnlocked}
        journalMarkerCount={journalMarkerCount}
      />

      <WatchlistJournalStats intel={intel} />

      {setupMode ? (
        <div id="journal-plan">
          <WatchlistJournalPlanForm
            symbol={journal.symbol}
            initial={journal}
            onSaved={handlePlanSaved}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-8 lg:gap-10">
        {!setupMode ? (
          <div id="journal-plan">
            <WatchlistJournalPlanForm
              symbol={journal.symbol}
              initial={journal}
              onSaved={handlePlanSaved}
            />
          </div>
        ) : null}

        <WatchlistJournalScenarioStrip journal={journal} />

        <div id="journal-research">
          <JournalResearchPanel
            symbol={journal.symbol}
            journal={journal}
            hasThesis={Boolean(journal.thesis?.trim())}
            onEntrySaved={handleEntryAdded}
            onPlanUpdated={handlePlanSaved}
          />
        </div>

        <div id="journal-entries">
          <WatchlistJournalTimeline
            symbol={journal.symbol}
            entries={entries}
            onEntryAdded={handleEntryAdded}
            prefillEntryType={prefillEntry}
          />
        </div>
      </div>

      <div id="journal-edit-log">
        <WatchlistJournalEditLog revisions={revisions} />
      </div>
    </div>
  );
}
