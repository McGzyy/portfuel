"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { DiscoveryArchiveTable } from "@/components/admin/DiscoveryArchiveTable";
import { DiscoveryCandidateCard } from "@/components/admin/DiscoveryCandidateCard";
import {
  DiscoveryActionToast,
  type DiscoveryToastState,
} from "@/components/admin/DiscoveryActionToast";
import { DiscoveryContextRail } from "@/components/admin/DiscoveryContextRail";
import {
  DiscoveryQueueSkeleton,
  DiscoveryWorkboardSkeleton,
} from "@/components/admin/DiscoveryQueueSkeleton";
import {
  DiscoveryQueueListHeader,
  DiscoveryQueueToolbar,
} from "@/components/admin/DiscoveryQueueToolbar";
import {
  DiscoveryWorkflowStepper,
  type StepId,
} from "@/components/admin/DiscoveryWorkflowStepper";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import type {
  DiscoveryCandidateRow,
  DiscoveryCandidateStatus,
  DiscoveryScanSummary,
} from "@/lib/desk-discovery/types";
import { DISCOVERY_PROVIDER_ROADMAP } from "@/lib/desk-discovery/roadmap";
import {
  sortDiscoveryCandidates,
  type DiscoverySortMode,
} from "@/lib/desk-discovery/candidate-sort";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import {
  buildDiscoveryAdminUrl,
  parseDiscoveryFilter,
  parseDiscoverySort,
  type DiscoveryPanelFilter,
} from "@/lib/admin/discovery-panel-url";
import { useAdminNavCounts } from "@/components/admin/AdminNavCountsProvider";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<DiscoveryPanelFilter, string> = {
  inbox: "Inbox",
  ready: "Ready to publish",
  published: "Published",
  snoozed: "Snoozed",
  rejected: "Rejected",
};

const EMPTY_COPY: Record<DiscoveryPanelFilter, string> = {
  inbox: "Inbox empty — run a scan or wait for the next cron pass.",
  ready: "Nothing queued — approve hits from Inbox or use AI draft & queue.",
  published: "No published discovery calls yet.",
  snoozed: "No snoozed symbols.",
  rejected: "No rejected symbols.",
};

const FILTER_TO_STEP: Record<DiscoveryPanelFilter, StepId> = {
  inbox: "inbox",
  ready: "ready",
  published: "published",
  snoozed: "inbox",
  rejected: "inbox",
};

function filterPillClass(active: boolean) {
  return active
    ? "rounded-full border border-[var(--pf-red)] bg-[var(--pf-red-muted)] px-3 py-1.5 text-xs font-bold text-[var(--pf-red)]"
    : "rounded-full border border-[var(--pf-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-gray-700)] hover:bg-[var(--pf-gray-50)]";
}

function fmtScanWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminDiscoveryPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [candidates, setCandidates] = useState<DiscoveryCandidateRow[]>([]);
  const [lastScan, setLastScan] = useState<DiscoveryScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<DiscoveryToastState>(null);
  const [filter, setFilter] = useState<DiscoveryPanelFilter>(() =>
    parseDiscoveryFilter(searchParams.get("filter"))
  );
  const [sortMode, setSortMode] = useState<DiscoverySortMode>(() =>
    parseDiscoverySort(searchParams.get("sort"))
  );
  const [highPriorityOnly, setHighPriorityOnly] = useState(
    () => searchParams.get("hp") === "1"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get("id"));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [publishRowId, setPublishRowId] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [actionableCount, setActionableCount] = useState(0);

  const listRef = useRef<HTMLUListElement>(null);
  const readyCount = Math.max(0, actionableCount - pendingCount);
  const { refresh: refreshNavCounts } = useAdminNavCounts();

  const syncUrl = useCallback(
    (next: {
      filter?: DiscoveryPanelFilter;
      sort?: DiscoverySortMode;
      id?: string | null;
      highPriority?: boolean;
    }) => {
      const href = buildDiscoveryAdminUrl({
        filter: next.filter ?? filter,
        sort: next.sort ?? sortMode,
        id: next.id !== undefined ? next.id : selectedId,
        highPriority: next.highPriority ?? highPriorityOnly,
      });
      router.replace(href, { scroll: false });
    },
    [router, filter, sortMode, selectedId, highPriorityOnly]
  );

  useEffect(() => {
    setFilter(parseDiscoveryFilter(searchParams.get("filter")));
    setSortMode(parseDiscoverySort(searchParams.get("sort")));
    setHighPriorityOnly(searchParams.get("hp") === "1");
    setSelectedId(searchParams.get("id"));
  }, [searchParams]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/desk-discovery?status=${filter}`);
      const json = await res.json();
      if (!res.ok) {
        setError("Could not load discovery inbox.");
        return;
      }
      setCandidates(json.candidates ?? []);
      setLastScan(json.lastScan ?? null);
      setPendingCount(json.pendingCount ?? 0);
      setActionableCount(json.actionableCount ?? 0);
      setMigrationMissing(Boolean(json.migrationMissing));
      setAiConfigured(json.aiConfigured !== false);
      void refreshNavCounts();
    } catch {
      setError("Could not load discovery inbox.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter, refreshNavCounts]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setExpandedId(null);
    setFocusedIndex(0);
    setSelectedId(null);
    setPublishRowId(null);
  }, [filter]);

  const highPriorityCount = useMemo(
    () => candidates.filter((r) => r.score >= DISCOVERY_CONFIG.highScoreNotifyThreshold).length,
    [candidates]
  );

  const queueRows = useMemo(() => {
    let rows = candidates;
    if (highPriorityOnly) {
      rows = rows.filter((r) => r.score >= DISCOVERY_CONFIG.highScoreNotifyThreshold);
    }
    return sortDiscoveryCandidates(rows, sortMode);
  }, [candidates, sortMode, highPriorityOnly]);

  const useArchiveTable =
    filter === "published" || filter === "snoozed" || filter === "rejected";

  const focusedRow = queueRows[focusedIndex] ?? null;

  useEffect(() => {
    setFocusedIndex((i) => Math.min(i, Math.max(0, queueRows.length - 1)));
  }, [queueRows.length]);

  useEffect(() => {
    if (!listRef.current || useArchiveTable) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-discovery-row="${focusedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex, useArchiveTable]);

  const selectRowAtIndex = useCallback(
    (index: number) => {
      const row = queueRows[index];
      if (!row) return;
      setFocusedIndex(index);
      setSelectedId(row.id);
      syncUrl({ id: row.id });
    },
    [queueRows, syncUrl]
  );

  useEffect(() => {
    if (useArchiveTable || queueRows.length === 0 || loading) return;
    const urlId = searchParams.get("id");
    if (urlId) {
      const idx = queueRows.findIndex((r) => r.id === urlId);
      if (idx >= 0) {
        setFocusedIndex(idx);
        setSelectedId(urlId);
        return;
      }
    }
    selectRowAtIndex(0);
  }, [filter, queueRows.length, useArchiveTable, loading]); // eslint-disable-line react-hooks/exhaustive-deps -- init selection when queue loads

  const showToast = useCallback((message: string, undo?: () => void) => {
    setToast({ message, undo });
  }, []);

  const patchStatus = useCallback(
    async (
      row: DiscoveryCandidateRow,
      status: DiscoveryCandidateStatus,
      toastLabel: string,
      undoStatus?: DiscoveryCandidateStatus
    ) => {
      const snapshot = candidates;
      const prevPending = pendingCount;
      const prevActionable = actionableCount;

      setCandidates((prev) => prev.filter((c) => c.id !== row.id));
      if (status === "approved" && filter === "inbox") {
        setPendingCount((n) => Math.max(0, n - 1));
        setActionableCount((n) => n + 1);
      }

      showToast(`${row.symbol} ${toastLabel}`, undoStatus
        ? () => {
            setCandidates(snapshot);
            setPendingCount(prevPending);
            setActionableCount(prevActionable);
            void fetch(`/api/admin/desk-discovery/${row.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: undoStatus }),
            }).then(() => load({ silent: true }));
          }
        : undefined);

      try {
        const res = await fetch(`/api/admin/desk-discovery/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("patch failed");
        await load({ silent: true });
      } catch {
        setCandidates(snapshot);
        setPendingCount(prevPending);
        setActionableCount(prevActionable);
        setError("Update failed.");
        setToast(null);
      }
    },
    [candidates, filter, load, pendingCount, actionableCount, showToast]
  );

  const queueFocused = useCallback(async () => {
    const row = focusedRow;
    if (!row || filter !== "inbox") return;
    setError("");
    await patchStatus(row, "approved", "queued to publish", "pending");
  }, [focusedRow, filter, patchStatus]);

  const rejectFocused = useCallback(async () => {
    const row = focusedRow;
    if (!row || useArchiveTable) return;
    await patchStatus(row, "rejected", "rejected", row.status);
  }, [focusedRow, patchStatus, useArchiveTable]);

  const snoozeFocused = useCallback(async () => {
    const row = focusedRow;
    if (!row || useArchiveTable) return;
    await patchStatus(row, "snoozed", "snoozed for 7 days", row.status);
  }, [focusedRow, patchStatus, useArchiveTable]);

  useEffect(() => {
    if (useArchiveTable || queueRows.length === 0) return;

    function isTypingTarget(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (e.key === "j") {
        e.preventDefault();
        selectRowAtIndex(Math.min(queueRows.length - 1, focusedIndex + 1));
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        selectRowAtIndex(Math.max(0, focusedIndex - 1));
        return;
      }
      if (e.key === "Enter" && window.innerWidth < 1024) {
        e.preventDefault();
        const row = queueRows[focusedIndex];
        if (!row) return;
        setExpandedId((id) => (id === row.id ? null : row.id));
        return;
      }
      if (e.key === "a" && filter === "inbox") {
        e.preventDefault();
        void queueFocused();
        return;
      }
      if (e.key === "p" && filter === "ready") {
        e.preventDefault();
        const row = queueRows[focusedIndex];
        if (row) setPublishRowId(row.id);
        return;
      }
      if (e.key === "x") {
        e.preventDefault();
        void rejectFocused();
        return;
      }
      if (e.key === "s") {
        e.preventDefault();
        void snoozeFocused();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    useArchiveTable,
    queueRows,
    focusedIndex,
    filter,
    queueFocused,
    rejectFocused,
    snoozeFocused,
    selectRowAtIndex,
  ]);

  const restoreToInbox = useCallback(
    async (id: string, symbol: string) => {
      setError("");
      const res = await fetch(`/api/admin/desk-discovery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });
      if (!res.ok) {
        setError("Restore failed.");
        return;
      }
      showToast(`${symbol} restored to Inbox`);
      await load({ silent: true });
    },
    [load, showToast]
  );

  async function runScan() {
    setScanning(true);
    setError("");
    try {
      const res = await fetch("/api/admin/desk-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "migration_missing") {
          setMigrationMissing(true);
          setError("Run discovery migrations in Supabase first.");
        } else {
          setError("Scan failed.");
        }
        return;
      }
      setCandidates(json.candidates ?? []);
      setLastScan(json.summary ?? null);
      const summary = json.summary as DiscoveryScanSummary | undefined;
      if (summary && summary.hitsFound > 0 && summary.upserted === 0) {
        if (summary.saveErrors?.length) {
          setError(
            `Found ${summary.hitsFound} hits but save failed: ${summary.saveErrors[0]}. Apply discovery migrations in Supabase if you have not yet.`
          );
        } else if (summary.skippedExisting > 0) {
          showToast(
            `Scan found ${summary.hitsFound} hits — ${summary.skippedExisting} skipped (already handled).`
          );
        } else {
          setError(
            `Found ${summary.hitsFound} hits but none were saved. Confirm desk_signal_candidates migrations are applied.`
          );
        }
      } else {
        showToast(
          `Scan complete — ${summary?.upserted ?? 0} saved from ${summary?.hitsFound ?? 0} hits.`
        );
      }
      await load();
    } catch {
      setError("Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  function selectRow(id: string, index: number) {
    selectRowAtIndex(index);
  }

  function changeFilter(next: DiscoveryPanelFilter) {
    setFilter(next);
    syncUrl({ filter: next, id: null });
  }

  function changeSort(next: DiscoverySortMode) {
    setSortMode(next);
    syncUrl({ sort: next });
  }

  function changeHighPriority(next: boolean) {
    setHighPriorityOnly(next);
    syncUrl({ highPriority: next });
  }

  const queueContent =
    candidates.length === 0 ? (
      <div className="pf-workspace-panel p-8 text-center text-sm text-[var(--pf-gray-500)]">
        {EMPTY_COPY[filter]}
      </div>
    ) : (
      <div className="space-y-3">
        <DiscoveryQueueToolbar
          sort={sortMode}
          onSortChange={changeSort}
          highPriorityOnly={highPriorityOnly}
          onHighPriorityOnlyChange={changeHighPriority}
          highPriorityCount={highPriorityCount}
          totalCount={queueRows.length}
        />
        <DiscoveryQueueListHeader count={queueRows.length} filterLabel={TAB_LABELS[filter].toLowerCase()} />

        {/* Mobile: accordion list */}
        <ul className="divide-y divide-[var(--pf-border)] overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)] lg:hidden">
          {queueRows.map((row, index) => (
            <DiscoveryCandidateCard
              key={row.id}
              row={row}
              filter={filter}
              layout="accordion"
              expanded={expandedId === row.id}
              onExpandedChange={(open) => setExpandedId(open ? row.id : null)}
              focused={focusedIndex === index}
              publishRequested={publishRowId === row.id}
              onPublishHandled={() => setPublishRowId(null)}
              onUpdated={() => load({ silent: true })}
              onMessage={showToast}
              onError={setError}
            />
          ))}
        </ul>

        {/* Desktop: split workboard */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
          <ul
            ref={listRef}
            className="max-h-[calc(100dvh-14rem)] divide-y divide-[var(--pf-border)] overflow-y-auto overscroll-contain rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]"
          >
            {queueRows.map((row, index) => (
              <DiscoveryCandidateCard
                key={row.id}
                row={row}
                filter={filter}
                layout="row"
                rowIndex={index}
                expanded={false}
                onExpandedChange={() => {}}
                selected={focusedRow?.id === row.id}
                focused={focusedIndex === index}
                onSelect={() => selectRow(row.id, index)}
                publishRequested={false}
                onUpdated={() => load({ silent: true })}
                onMessage={showToast}
                onError={setError}
              />
            ))}
          </ul>
          <div className="min-h-[min(70dvh,40rem)]">
            {focusedRow ? (
              <DiscoveryCandidateCard
                key={focusedRow.id}
                row={focusedRow}
                filter={filter}
                layout="detail"
                expanded
                onExpandedChange={() => {}}
                publishRequested={publishRowId === focusedRow.id}
                onPublishHandled={() => setPublishRowId(null)}
                onUpdated={() => load({ silent: true })}
                onMessage={showToast}
                onError={setError}
              />
            ) : (
              <div className="pf-workspace-panel flex h-full min-h-[16rem] items-center justify-center p-8 text-center text-sm text-[var(--pf-gray-500)]">
                Select a symbol from the queue to review signals and edit the draft.
              </div>
            )}
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        group="Content & desk"
        title="Discovery radar"
        description="Market scan hits land in Inbox for triage. Queue the best setups, then publish as Fueled calls — nothing auto-posts."
        actions={
          <Button type="button" onClick={() => void runScan()} disabled={scanning} className="xl:hidden">
            {scanning ? "Scanning…" : "Run scan"}
          </Button>
        }
        footer={
          <div className="space-y-4 border-t border-[var(--pf-border)] pt-4 xl:hidden">
            <MetricsStrip
              variant="embedded"
              className="!px-0"
              eyebrow="Pipeline"
              items={[
                {
                  label: "Inbox",
                  value: String(pendingCount),
                  accent: pendingCount > 0 ? "negative" : undefined,
                  hint: pendingCount > 0 ? "Needs triage" : "Clear",
                },
                {
                  label: "Ready",
                  value: String(readyCount),
                  accent: readyCount > 0 ? "positive" : undefined,
                  hint: readyCount > 0 ? "Awaiting publish" : undefined,
                },
                {
                  label: "In view",
                  value: String(candidates.length),
                  hint: TAB_LABELS[filter],
                },
                {
                  label: "Last scan",
                  value: lastScan ? String(lastScan.hitsFound) : "—",
                  hint: lastScan
                    ? `${fmtScanWhen(lastScan.scannedAt)} · ${lastScan.upserted} saved`
                    : "No scan yet",
                },
              ]}
            />
            <DiscoveryWorkflowStepper
              activeStep={FILTER_TO_STEP[filter]}
              counts={{ inbox: pendingCount, ready: readyCount }}
            />
          </div>
        }
      />

      {migrationMissing ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Discovery tables are missing — apply the desk_signal_candidates migrations in Supabase
          (see <code className="text-xs">supabase/scripts/portfuel-discovery-one-shot.sql</code>).
        </div>
      ) : null}

      {!aiConfigured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">OPENAI_API_KEY not configured.</span> AI drafts fall back to
          templates until the key is set on the server.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as DiscoveryPanelFilter[]).map((key) => {
          const badge =
            key === "inbox" && pendingCount > 0
              ? ` (${pendingCount})`
              : key === "ready" && readyCount > 0
                ? ` (${readyCount})`
                : "";
          return (
            <button
              key={key}
              type="button"
              onClick={() => changeFilter(key)}
              className={filterPillClass(filter === key)}
            >
              {TAB_LABELS[key]}
              {badge}
            </button>
          );
        })}
      </div>

      {loading ? (
        <>
          <div className="lg:hidden">
            <DiscoveryQueueSkeleton />
          </div>
          <DiscoveryWorkboardSkeleton />
        </>
      ) : (
        <div className="flex gap-5 xl:gap-6">
          <div className="min-w-0 flex-1">
            {useArchiveTable ? (
              <DiscoveryArchiveTable
                rows={candidates}
                variant={filter}
                onRestore={restoreToInbox}
              />
            ) : (
              queueContent
            )}
          </div>

          <DiscoveryContextRail
            filter={filter}
            activeStep={FILTER_TO_STEP[filter]}
            pendingCount={pendingCount}
            readyCount={readyCount}
            lastScan={lastScan}
            scanning={scanning}
            onRunScan={() => void runScan()}
            focusedRow={useArchiveTable ? null : focusedRow}
            queueMode={!useArchiveTable}
            onQueue={filter === "inbox" ? () => void queueFocused() : undefined}
            onPublish={
              filter === "ready" && focusedRow
                ? () => setPublishRowId(focusedRow.id)
                : undefined
            }
            onReject={useArchiveTable ? undefined : () => void rejectFocused()}
            onSnooze={useArchiveTable ? undefined : () => void snoozeFocused()}
          />
        </div>
      )}

      <details className="pf-workspace-panel group">
        <summary className="cursor-pointer list-none p-4 text-sm font-semibold text-[var(--pf-gray-600)] marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="text-[var(--pf-gray-400)] group-open:hidden">▸</span>
          <span className="hidden text-[var(--pf-gray-400)] group-open:inline">▾</span>
          {" "}Advanced — provider roadmap
        </summary>
        <div className="border-t border-[var(--pf-border)] px-4 pb-4 pt-3">
          <ul className="space-y-3 text-sm text-[var(--pf-gray-600)]">
            <li>
              <span className="font-medium text-[var(--pf-black)]">
                {DISCOVERY_PROVIDER_ROADMAP.lite.label}
              </span>
              {" — "}
              {DISCOVERY_PROVIDER_ROADMAP.lite.providers.join(", ")} (active)
            </li>
            <li>
              <span className="font-medium text-[var(--pf-black)]">
                {DISCOVERY_PROVIDER_ROADMAP.phase2.label}
              </span>
              {" — est. $"}
              {DISCOVERY_PROVIDER_ROADMAP.phase2.estMonthlyUsd}
              /mo. {DISCOVERY_PROVIDER_ROADMAP.phase2.notes}
            </li>
            <li>
              <span className="font-medium text-[var(--pf-black)]">
                {DISCOVERY_PROVIDER_ROADMAP.phase3.label}
              </span>
              {" — est. $"}
              {DISCOVERY_PROVIDER_ROADMAP.phase3.estMonthlyUsd}
              /mo. {DISCOVERY_PROVIDER_ROADMAP.phase3.notes}
            </li>
          </ul>
        </div>
      </details>

      <DiscoveryActionToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
