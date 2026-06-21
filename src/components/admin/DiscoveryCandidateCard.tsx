"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
import { sanitizeDiscoveryDraft } from "@/lib/desk-discovery/level-sanity";
import { buildScoreBreakdown } from "@/lib/desk-discovery/score-breakdown";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { DiscoveryPublishModal } from "@/components/admin/DiscoveryPublishModal";

/** Persists across card remounts so silent level fixes do not re-PATCH in a loop. */
const autoSanitizedDiscoveryIds = new Set<string>();

const SIGNAL_LABELS: Record<DiscoverySignalType, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
};

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
  const [publishOpen, setPublishOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [signalsOpen, setSignalsOpen] = useState(false);
  const priceSanitizedRef = useRef(false);

  useEffect(() => {
    if (!dirty) {
      setDraft(emptyDraft(row));
    }
  }, [row.id, row.updatedAt, row.draft, dirty]);

  useEffect(() => {
    if (!row.draft || priceSanitizedRef.current || autoSanitizedDiscoveryIds.has(row.id)) return;

    let cancelled = false;
    const base = emptyDraft(row);

    void (async () => {
      try {
        const res = await fetch(
          `/api/symbols/validate?symbol=${encodeURIComponent(row.symbol)}&assetClass=${row.assetClass}`
        );
        const data = await res.json();
        if (cancelled || !data.ok || typeof data.lastPrice !== "number") return;

        const sanitized = sanitizeDiscoveryDraft(base, data.lastPrice);
        if (cancelled) return;

        priceSanitizedRef.current = true;

        const levelsChanged =
          sanitized.entryNote !== base.entryNote ||
          sanitized.targetNote !== base.targetNote ||
          sanitized.stopNote !== base.stopNote;

        if (!levelsChanged) return;

        if (!dirty) setDraft(sanitized);

        if (!autoSanitizedDiscoveryIds.has(row.id)) {
          autoSanitizedDiscoveryIds.add(row.id);
          await fetch(`/api/admin/desk-discovery/${row.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft: sanitized }),
          });
        }
      } catch {
        /* keep base draft */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [row.id, row.symbol, row.assetClass, row.draft]);

  useEffect(() => {
    priceSanitizedRef.current = false;
  }, [row.id]);

  const isPublished = row.status === "published";
  const isInbox = row.status === "pending";
  const isReady = row.status === "approved";
  const isHighScore = row.score >= DISCOVERY_CONFIG.highScoreNotifyThreshold;
  const scoreLines = buildScoreBreakdown(row.signalTypes);
  const uniqueReasons = row.reasons.filter(
    (r, i, arr) => arr.findIndex((x) => x.detail === r.detail) === i
  );
  const draftSummary = [
    draft.direction.toUpperCase(),
    draft.timeframe || null,
    draft.entryNote ?? null,
    draft.thesis.trim().slice(0, 72) + (draft.thesis.length > 72 ? "…" : ""),
  ]
    .filter(Boolean)
    .join(" · ");

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
      if (json.draft) {
        autoSanitizedDiscoveryIds.delete(row.id);
        priceSanitizedRef.current = false;
        setDraft(json.draft);
        setDraftOpen(true);
      }
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
          <button
            type="button"
            onClick={() => setSignalsOpen((v) => !v)}
            className="mt-2 flex w-full items-center gap-1.5 text-left text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--foreground)]"
            aria-expanded={signalsOpen}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${signalsOpen ? "rotate-180" : ""}`}
              strokeWidth={2.25}
            />
            Signal details
            {!signalsOpen ? ` · ${uniqueReasons[0]?.detail ?? row.headline ?? "View"}` : null}
          </button>
          {signalsOpen ? (
            <>
              <ul className="mt-1 space-y-0.5 text-xs text-[var(--pf-gray-500)]">
                {uniqueReasons.map((r, i) => (
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
            </>
          ) : null}
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
                <Button
                  type="button"
                  size="sm"
                  disabled={draft.thesis.trim().length < 20}
                  className="bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]"
                  onClick={() => setPublishOpen(true)}
                >
                  Publish Fueled call
                </Button>
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
        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]">
          <button
            type="button"
            onClick={() => setDraftOpen((v) => !v)}
            className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-[var(--pf-gray-100)]/80"
            aria-expanded={draftOpen}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Draft thesis
              </p>
              {!draftOpen && draft.thesis.trim().length >= 20 ? (
                <p className="mt-1 line-clamp-2 text-sm text-[var(--pf-gray-700)]">{draftSummary}</p>
              ) : !draftOpen ? (
                <p className="mt-1 text-sm text-[var(--pf-gray-500)]">No draft yet — expand to edit or run AI.</p>
              ) : null}
            </div>
            <ChevronDown
              className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--pf-gray-400)] transition-transform ${draftOpen ? "rotate-180" : ""}`}
              strokeWidth={2.25}
            />
          </button>
          {draftOpen ? (
          <div className="space-y-3 border-t border-[var(--pf-border)] px-3 py-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
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
        </div>
      ) : null}
      {publishOpen && isReady ? (
        <DiscoveryPublishModal
          row={row}
          draft={draft}
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          onPublished={onUpdated}
        />
      ) : null}
    </li>
  );
}
