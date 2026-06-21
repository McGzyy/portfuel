"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPanelHeader } from "@/components/admin/AdminPanelHeader";
import type {
  DiscoveryCandidateRow,
  DiscoveryScanSummary,
  DiscoverySignalType,
} from "@/lib/desk-discovery/types";
import { DISCOVERY_PROVIDER_ROADMAP } from "@/lib/desk-discovery/roadmap";

const SIGNAL_LABELS: Record<DiscoverySignalType, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
};

function publishHref(row: DiscoveryCandidateRow, thesis?: string): string {
  const params = new URLSearchParams();
  params.set("symbol", row.symbol);
  params.set("fueled", "1");
  if (row.assetClass === "crypto") params.set("asset", "crypto");
  if (thesis?.trim()) params.set("thesis", thesis.trim());
  return `/calls/new?${params.toString()}`;
}

export function AdminDiscoveryPanel() {
  const [candidates, setCandidates] = useState<DiscoveryCandidateRow[]>([]);
  const [lastScan, setLastScan] = useState<DiscoveryScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftLoading, setDraftLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/desk-discovery");
      const json = await res.json();
      if (!res.ok) {
        setError("Could not load discovery inbox.");
        return;
      }
      setCandidates(json.candidates ?? []);
      setLastScan(json.lastScan ?? null);
      setMigrationMissing(Boolean(json.migrationMissing));
    } catch {
      setError("Could not load discovery inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

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
          setError("Run migration 20260711100000_desk_signal_candidates.sql in Supabase first.");
        } else {
          setError("Scan failed.");
        }
        return;
      }
      setCandidates(json.candidates ?? []);
      setLastScan(json.summary ?? null);
      setMessage(
        `Scan complete — ${json.summary?.upserted ?? 0} updated, ${json.summary?.hitsFound ?? 0} scored hits.`
      );
    } catch {
      setError("Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  async function patchStatus(
    id: string,
    status: "snoozed" | "rejected" | "approved",
    snoozeDays?: number
  ) {
    setError("");
    try {
      const res = await fetch(`/api/admin/desk-discovery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, snoozeDays }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "demo_readonly" ? "Demo mode is read-only." : "Update failed."
        );
        return;
      }
      if (status === "approved") {
        setMessage(`${json.candidate?.symbol ?? "Symbol"} marked approved — publish when ready.`);
      }
      await load();
    } catch {
      setError("Update failed.");
    }
  }

  async function draftThesis(row: DiscoveryCandidateRow) {
    setDraftLoading(row.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/desk-discovery/${row.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "long" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "reasons_too_short" ? "Not enough signal detail to draft." : "Draft failed.");
        return;
      }
      setDrafts((prev) => ({ ...prev, [row.id]: json.text ?? "" }));
    } catch {
      setError("Draft failed.");
    } finally {
      setDraftLoading(null);
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
        description="Lite market scan for names worth a Fueled look — review, draft, then publish. Nothing auto-posts."
        actions={
          <Button type="button" onClick={() => void runScan()} disabled={scanning}>
            {scanning ? "Scanning…" : "Run scan"}
          </Button>
        }
        footer={
          lastScan ? (
            <p className="text-xs text-[var(--pf-gray-500)]">
              Last scan {new Date(lastScan.scannedAt).toLocaleString()} ·{" "}
              {lastScan.hitsFound} hits · {lastScan.upserted} saved · batch offset{" "}
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
          Apply{" "}
          <code className="text-xs">20260711100000_desk_signal_candidates.sql</code> in Supabase
          to enable the discovery inbox.
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      {candidates.length === 0 ? (
        <div className="pf-workspace-panel p-8 text-center text-sm text-[var(--pf-gray-500)]">
          Inbox empty — run a scan or wait for the next cron pass.
        </div>
      ) : (
        <ul className="space-y-4">
          {candidates.map((row) => (
            <li key={row.id} className="pf-workspace-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/ticker/${row.symbol}`}
                      className="text-lg font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                    >
                      {row.symbol}
                    </Link>
                    <span className="rounded-full bg-[var(--pf-gray-100)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
                      {row.assetClass}
                    </span>
                    <span className="text-sm font-semibold text-[var(--pf-red)]">
                      Score {row.score}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--pf-gray-600)]">
                    {row.headline ?? row.reasons[0]?.detail}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.signalTypes.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-[var(--pf-border)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--pf-gray-500)]"
                      >
                        {SIGNAL_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-2 space-y-0.5 text-xs text-[var(--pf-gray-500)]">
                    {row.reasons.map((r, i) => (
                      <li key={`${r.type}-${i}`}>
                        {SIGNAL_LABELS[r.type as DiscoverySignalType] ?? r.type}: {r.detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={draftLoading === row.id}
                    onClick={() => void draftThesis(row)}
                  >
                    {draftLoading === row.id ? "Drafting…" : "AI draft"}
                  </Button>
                  <Link
                    href={publishHref(row, drafts[row.id])}
                    className="inline-flex h-8 items-center justify-center rounded-[var(--pf-radius)] border border-[var(--pf-red)] px-3 text-xs font-semibold text-[var(--pf-red)] transition-all hover:bg-[var(--pf-red)] hover:text-white"
                  >
                    Publish
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void patchStatus(row.id, "snoozed")}
                  >
                    Snooze 7d
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void patchStatus(row.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
              {drafts[row.id] ? (
                <div className="mt-4 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                    Draft thesis
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--pf-gray-700)]">
                    {drafts[row.id]}
                  </p>
                </div>
              ) : null}
            </li>
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
