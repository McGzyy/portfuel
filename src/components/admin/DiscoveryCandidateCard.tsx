"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type {
  DiscoveryCandidateRow,
  DiscoverySignalType,
} from "@/lib/desk-discovery/types";
import type { DiscoveryDraftPayload } from "@/lib/desk-discovery/draft-types";
import { formatDiscoveryDraftForPublish } from "@/lib/desk-discovery/draft-types";
import { buildScoreBreakdown } from "@/lib/desk-discovery/score-breakdown";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";

const SIGNAL_LABELS: Record<DiscoverySignalType, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
};

function publishHref(row: DiscoveryCandidateRow): string {
  const params = new URLSearchParams();
  params.set("symbol", row.symbol);
  params.set("fueled", "1");
  params.set("discoveryId", row.id);
  if (row.assetClass === "crypto") params.set("asset", "crypto");
  return `/calls/new?${params.toString()}`;
}

function emptyDraft(row: DiscoveryCandidateRow): DiscoveryDraftPayload {
  return (
    row.draft ?? {
      direction: "long",
      thesis: "",
      catalyst: "",
      risk: "",
      timeframe: "",
    }
  );
}

export function DiscoveryCandidateCard({
  row,
  filter,
  onUpdated,
  onMessage,
  onError,
}: {
  row: DiscoveryCandidateRow;
  filter: string;
  onUpdated: () => Promise<void>;
  onMessage: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<DiscoveryDraftPayload>(() => emptyDraft(row));
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(emptyDraft(row));
    setDirty(false);
  }, [row.id, row.updatedAt, row.draft]);

  const isPublished = row.status === "published";
  const isInbox = row.status === "pending";
  const isReady = row.status === "approved";
  const isHighScore = row.score >= DISCOVERY_CONFIG.highScoreNotifyThreshold;
  const scoreLines = buildScoreBreakdown(row.signalTypes);

  async function patch(body: Record<string, unknown>) {
    onError("");
    const res = await fetch(`/api/admin/desk-discovery/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      onError(json.error === "demo_readonly" ? "Demo mode is read-only." : "Update failed.");
      return false;
    }
    await onUpdated();
    return true;
  }

  async function runAiDraft(autoApprove: boolean) {
    setDraftLoading(true);
    onError("");
    try {
      const res = await fetch(`/api/admin/desk-discovery/${row.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: draft.direction, autoApprove }),
      });
      const json = await res.json();
      if (!res.ok) {
        onError(
          json.error === "reasons_too_short"
            ? "Not enough signal detail to draft."
            : "Draft failed."
        );
        return;
      }
      if (json.draft) setDraft(json.draft);
      setDirty(false);
      onMessage(
        autoApprove
          ? `${row.symbol} drafted and queued to publish.`
          : `${row.symbol} draft saved — review in Inbox.`
      );
      await onUpdated();
    } catch {
      onError("Draft failed.");
    } finally {
      setDraftLoading(false);
    }
  }

  async function saveDraft(approve: boolean) {
    setSaving(true);
    const ok = await patch({
      draft,
      ...(approve && isInbox ? { status: "approved" } : {}),
    });
    setSaving(false);
    if (ok) {
      setDirty(false);
      onMessage(
        approve ? `${row.symbol} saved and queued to publish.` : `${row.symbol} draft saved.`
      );
    }
  }

  function updateDraft<K extends keyof DiscoveryDraftPayload>(key: K, value: DiscoveryDraftPayload[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  return (
    <li className="pf-workspace-panel p-5">
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
            {row.status !== "pending" ? (
              <span className="rounded-full bg-[var(--pf-gray-100)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-500)]">
                {row.status}
              </span>
            ) : null}
            <span className="text-sm font-semibold text-[var(--pf-red)]">Score {row.score}</span>
            {isHighScore && isInbox ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                High priority
              </span>
            ) : null}
            {row.draftGeneratedAt && !dirty ? (
              <span
                className={
                  row.draft?.source === "template"
                    ? "rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
                    : "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                }
              >
                {row.draft?.source === "template" ? "Template draft" : "AI draft"}
              </span>
            ) : null}
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
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            {scoreLines.map((line) => (
              <span key={line.label} className="rounded bg-[var(--pf-gray-50)] px-1.5 py-0.5">
                {line.label} +{line.points}
              </span>
            ))}
          </div>
          {row.publishedCallId ? (
            <p className="mt-2 text-xs">
              <Link
                href={`/ticker/${row.symbol}?call=${row.publishedCallId}`}
                className="font-semibold text-[var(--pf-red)] hover:underline"
              >
                View published Fueled call →
              </Link>
            </p>
          ) : null}
        </div>

        {!isPublished ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            {isInbox ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={draftLoading}
                  onClick={() => void runAiDraft(true)}
                >
                  {draftLoading ? "Drafting…" : "AI draft & queue"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void patch({ status: "approved" }).then((ok) => ok && onMessage(`${row.symbol} queued to publish.`))}
                >
                  Queue to publish
                </Button>
              </>
            ) : null}
            {isReady ? (
              <>
                <Link
                  href={publishHref(row)}
                  className="inline-flex h-8 items-center justify-center rounded-[var(--pf-radius)] border border-[var(--pf-red)] bg-[var(--pf-red)] px-3 text-xs font-semibold text-white transition-all hover:bg-[var(--pf-red-hover)]"
                >
                  Publish Fueled call
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={draftLoading}
                  onClick={() => void runAiDraft(false)}
                >
                  {draftLoading ? "Drafting…" : "Regenerate AI"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void patch({ status: "pending" }).then((ok) => ok && onMessage(`${row.symbol} moved back to Inbox.`))}
                >
                  Back to Inbox
                </Button>
              </>
            ) : null}
            {(filter === "snoozed" || filter === "rejected") && !isReady && !isInbox ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void patch({ status: "pending" }).then((ok) => ok && onMessage(`${row.symbol} restored to Inbox.`))}
              >
                Restore to Inbox
              </Button>
            ) : null}
            {!isReady ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void patch({ status: "snoozed" })}
                >
                  Snooze 7d
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void patch({ status: "rejected" })}
                >
                  Reject
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void patch({ status: "snoozed" })}
                >
                  Snooze 7d
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void patch({ status: "rejected" })}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {!isPublished ? (
        <div className="mt-4 space-y-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
              Draft thesis
            </p>
            <SegmentedControl
              value={draft.direction}
              onChange={(v) => updateDraft("direction", v as "long" | "short")}
              options={[
                { value: "long", label: "Long" },
                { value: "short", label: "Short" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`thesis-${row.id}`} className="text-xs">
              Thesis
            </Label>
            <Textarea
              id={`thesis-${row.id}`}
              value={draft.thesis}
              onChange={(e) => updateDraft("thesis", e.target.value)}
              rows={3}
              className="text-sm"
              placeholder="Setup and trade idea for the Fueled call…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`catalyst-${row.id}`} className="text-xs">
                Catalyst
              </Label>
              <Input
                id={`catalyst-${row.id}`}
                value={draft.catalyst}
                onChange={(e) => updateDraft("catalyst", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`timeframe-${row.id}`} className="text-xs">
                Timeframe
              </Label>
              <Input
                id={`timeframe-${row.id}`}
                value={draft.timeframe}
                onChange={(e) => updateDraft("timeframe", e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`risk-${row.id}`} className="text-xs">
              Risk
            </Label>
            <Input
              id={`risk-${row.id}`}
              value={draft.risk}
              onChange={(e) => updateDraft("risk", e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor={`entry-${row.id}`} className="text-xs">
                Entry note
              </Label>
              <Input
                id={`entry-${row.id}`}
                value={draft.entryNote ?? ""}
                onChange={(e) => updateDraft("entryNote", e.target.value || undefined)}
                className="text-sm"
                placeholder="e.g. 118 support"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`target-${row.id}`} className="text-xs">
                Target note
              </Label>
              <Input
                id={`target-${row.id}`}
                value={draft.targetNote ?? ""}
                onChange={(e) => updateDraft("targetNote", e.target.value || undefined)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`stop-${row.id}`} className="text-xs">
                Stop note
              </Label>
              <Input
                id={`stop-${row.id}`}
                value={draft.stopNote ?? ""}
                onChange={(e) => updateDraft("stopNote", e.target.value || undefined)}
                className="text-sm"
              />
            </div>
          </div>
          {draft.thesis.trim().length >= 20 ? (
            <p className="text-[10px] text-[var(--pf-gray-500)]">
              Publish preview: {formatDiscoveryDraftForPublish(draft).slice(0, 120)}
              {formatDiscoveryDraftForPublish(draft).length > 120 ? "…" : ""}
            </p>
          ) : null}
          {row.draft?.source === "template" ? (
            <p className="text-[10px] text-amber-800">
              Template draft — click Regenerate AI for full research-backed copy (requires OPENAI_API_KEY on
              server).
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving || draft.thesis.trim().length < 20}
              onClick={() => void saveDraft(false)}
            >
              {saving ? "Saving…" : "Save draft"}
            </Button>
            {isInbox ? (
              <Button
                type="button"
                size="sm"
                disabled={saving || draft.thesis.trim().length < 20}
                onClick={() => void saveDraft(true)}
              >
                Save & queue to publish
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
