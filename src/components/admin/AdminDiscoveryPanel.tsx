"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { DiscoveryArchiveTable } from "@/components/admin/DiscoveryArchiveTable";
import { DiscoveryCandidateCard } from "@/components/admin/DiscoveryCandidateCard";
import {
  DiscoveryQueueListHeader,
  DiscoveryQueueToolbar,
} from "@/components/admin/DiscoveryQueueToolbar";
import {
  DiscoveryWorkflowStepper,
  type StepId,
} from "@/components/admin/DiscoveryWorkflowStepper";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import type { DiscoveryCandidateRow, DiscoveryScanSummary } from "@/lib/desk-discovery/types";
import { DISCOVERY_PROVIDER_ROADMAP } from "@/lib/desk-discovery/roadmap";
import {
  sortDiscoveryCandidates,
  type DiscoverySortMode,
} from "@/lib/desk-discovery/candidate-sort";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { useAdminNavCounts } from "@/components/admin/AdminNavCountsProvider";
import { cn } from "@/lib/utils";

type InboxFilter = "inbox" | "ready" | "published" | "snoozed" | "rejected";

const TAB_LABELS: Record<InboxFilter, string> = {
  inbox: "Inbox",
  ready: "Ready to publish",
  published: "Published",
  snoozed: "Snoozed",
  rejected: "Rejected",
};

const EMPTY_COPY: Record<InboxFilter, string> = {
  inbox: "Inbox empty — run a scan or wait for the next cron pass.",
  ready: "Nothing queued — approve hits from Inbox or use AI draft & queue.",
  published: "No published discovery calls yet.",
  snoozed: "No snoozed symbols.",
  rejected: "No rejected symbols.",
};

const FILTER_TO_STEP: Record<InboxFilter, StepId> = {
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
  const [candidates, setCandidates] = useState<DiscoveryCandidateRow[]>([]);
  const [lastScan, setLastScan] = useState<DiscoveryScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("inbox");
  const [sortMode, setSortMode] = useState<DiscoverySortMode>("score");
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [publishRowId, setPublishRowId] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [actionableCount, setActionableCount] = useState(0);

  const readyCount = Math.max(0, actionableCount - pendingCount);
  const { refresh: refreshNavCounts } = useAdminNavCounts();

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
    setHighPriorityOnly(false);
    setFocusedIndex(0);
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

  const useArchiveTable = filter === "published" || filter === "snoozed" || filter === "rejected";

  useEffect(() => {
    setFocusedIndex((i) => Math.min(i, Math.max(0, queueRows.length - 1)));
  }, [queueRows.length]);

  useEffect(() => {
    if (useArchiveTable || queueRows.length === 0) return;

    function isTypingTarget(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    }

    async function queueFocused() {
      const row = queueRows[focusedIndex];
      if (!row) return;
      setError("");
      const res = await fetch(`/api/admin/desk-discovery/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) {
        setError("Queue failed.");
        return;
      }
      setMessage(`${row.symbol} queued to publish.`);
      await load({ silent: true });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      if (e.key === "j") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(queueRows.length - 1, i + 1));
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter") {
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
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [useArchiveTable, queueRows, focusedIndex, filter, load]);

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
      setMessage(`${symbol} restored to Inbox.`);
      await load({ silent: true });
    },
    [load]
  );

  async function runScan() {
    setScanning(true);
    setMessage("");
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
          setMessage(
            `Scan found ${summary.hitsFound} hits — ${summary.skippedExisting} skipped (snoozed, rejected, or already published).`
          );
        } else {
          setError(
            `Found ${summary.hitsFound} hits but none were saved. Confirm desk_signal_candidates migrations are applied.`
          );
        }
      } else {
        setMessage(
          `Scan complete — ${summary?.upserted ?? 0} saved, ${summary?.hitsFound ?? 0} scored hits${
            summary?.notifiedAdmins
              ? `, ${summary.notifiedAdmins} admin alert(s) sent`
              : ""
          }. High-score hits get an AI draft pre-filled in Inbox.`
        );
      }
      await load();
    } catch {
      setError("Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pf-border)] border-t-[var(--pf-red)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        group="Content & desk"
        title="Discovery radar"
        description="Market scan hits land in Inbox for triage. Queue the best setups, then publish as Fueled calls — nothing auto-posts."
        actions={
          <Button type="button" onClick={() => void runScan()} disabled={scanning}>
            {scanning ? "Scanning…" : "Run scan"}
          </Button>
        }
        footer={
          <div className="space-y-4 border-t border-[var(--pf-border)] pt-4">
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
          templates until the key is set on the server — Regenerate AI will not produce full
          research-backed copy.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as InboxFilter[]).map((key) => {
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
              onClick={() => setFilter(key)}
              className={filterPillClass(filter === key)}
            >
              {TAB_LABELS[key]}
              {badge}
            </button>
          );
        })}
      </div>

      {candidates.length === 0 ? (
        <div className="pf-workspace-panel p-8 text-center text-sm text-[var(--pf-gray-500)]">
          {EMPTY_COPY[filter]}
        </div>
      ) : useArchiveTable ? (
        <DiscoveryArchiveTable
          rows={candidates}
          variant={filter}
          onRestore={restoreToInbox}
        />
      ) : (
        <div className="space-y-3">
          <DiscoveryQueueToolbar
            sort={sortMode}
            onSortChange={setSortMode}
            highPriorityOnly={highPriorityOnly}
            onHighPriorityOnlyChange={setHighPriorityOnly}
            highPriorityCount={highPriorityCount}
            totalCount={queueRows.length}
          />
          <DiscoveryQueueListHeader count={queueRows.length} filterLabel={TAB_LABELS[filter].toLowerCase()} />
          {!useArchiveTable && queueRows.length > 0 ? (
            <p className="px-1 text-[10px] text-[var(--pf-gray-400)]">
              Shortcuts: <kbd className="rounded border px-1">j</kbd>/<kbd className="rounded border px-1">k</kbd> navigate ·{" "}
              <kbd className="rounded border px-1">Enter</kbd> expand ·{" "}
              {filter === "inbox" ? (
                <>
                  <kbd className="rounded border px-1">a</kbd> queue
                </>
              ) : (
                <>
                  <kbd className="rounded border px-1">p</kbd> publish
                </>
              )}
            </p>
          ) : null}
          <ul
            className={cn(
              "divide-y divide-[var(--pf-border)] overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white shadow-[var(--pf-shadow-sm)]"
            )}
          >
            {queueRows.map((row, index) => (
              <DiscoveryCandidateCard
                key={row.id}
                row={row}
                filter={filter}
                expanded={expandedId === row.id}
                onExpandedChange={(open) => setExpandedId(open ? row.id : null)}
                focused={focusedIndex === index}
                publishRequested={publishRowId === row.id}
                onPublishHandled={() => setPublishRowId(null)}
                onUpdated={() => load({ silent: true })}
                onMessage={setMessage}
                onError={setError}
              />
            ))}
          </ul>
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
    </div>
  );
}
