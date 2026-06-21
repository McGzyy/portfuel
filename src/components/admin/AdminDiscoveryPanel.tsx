"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import { DiscoveryCandidateCard } from "@/components/admin/DiscoveryCandidateCard";
import type { DiscoveryCandidateRow, DiscoveryScanSummary } from "@/lib/desk-discovery/types";
import { DISCOVERY_PROVIDER_ROADMAP } from "@/lib/desk-discovery/roadmap";

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

export function AdminDiscoveryPanel() {
  const [candidates, setCandidates] = useState<DiscoveryCandidateRow[]>([]);
  const [lastScan, setLastScan] = useState<DiscoveryScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("inbox");
  const [pendingCount, setPendingCount] = useState(0);
  const [actionableCount, setActionableCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
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
    } catch {
      setError("Could not load discovery inbox.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

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
    <div className="max-w-4xl space-y-6">
      <AdminPanelHeader
        group="Content & desk"
        title="Discovery radar"
        description="Lite market scan → Inbox triage → Ready queue → Fueled publish. Nothing auto-posts."
        actions={
          <Button type="button" onClick={() => void runScan()} disabled={scanning}>
            {scanning ? "Scanning…" : "Run scan"}
          </Button>
        }
        footer={
          lastScan ? (
            <p className="text-xs text-[var(--pf-gray-500)]">
              Last scan {new Date(lastScan.scannedAt).toLocaleString()} ·{" "}
              {lastScan.hitsFound} hits · {lastScan.upserted} saved
              {lastScan.notifiedAdmins ? ` · ${lastScan.notifiedAdmins} alerted` : ""} · batch offset{" "}
              {lastScan.equityRotationOffset} · tier {lastScan.providerTier}
            </p>
          ) : (
            <p className="text-xs text-[var(--pf-gray-500)]">
              No scan yet — cron runs weekdays or use Run scan.
            </p>
          )
        }
      />

      {migrationMissing ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Apply these migrations in Supabase if you have not yet:
          <ul className="mt-2 list-inside list-disc text-xs">
            <li>
              <code>20260711100000_desk_signal_candidates.sql</code>
            </li>
            <li>
              <code>20260712100000_desk_discovery_hardening.sql</code>
            </li>
            <li>
              <code>20260713100000_desk_discovery_symbol_unique.sql</code>
            </li>
            <li>
              <code>20260714100000_desk_discovery_drafts.sql</code>
            </li>
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as InboxFilter[]).map((key) => {
          const badge =
            key === "inbox" && pendingCount > 0
              ? ` (${pendingCount})`
              : key === "ready" && actionableCount > pendingCount
                ? ` (${actionableCount - pendingCount})`
                : "";
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={
                filter === key
                  ? "pf-pill-active rounded-full px-3 py-1.5 text-xs font-semibold"
                  : "rounded-full border border-[var(--pf-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-50)]"
              }
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
      ) : (
        <ul className="space-y-4">
          {candidates.map((row) => (
            <DiscoveryCandidateCard
              key={row.id}
              row={row}
              filter={filter}
              onUpdated={load}
              onMessage={setMessage}
              onError={setError}
            />
          ))}
        </ul>
      )}

      <section className="pf-workspace-panel p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
          Provider roadmap
        </p>
        <h3 className="mt-1 text-sm font-bold text-[var(--pf-black)]">Paid tiers (future)</h3>
        <ul className="mt-3 space-y-3 text-sm text-[var(--pf-gray-600)]">
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
      </section>
    </div>
  );
}
