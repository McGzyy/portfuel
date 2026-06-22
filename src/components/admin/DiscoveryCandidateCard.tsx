"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { earningsLabel } from "@/lib/desk-discovery/candidate-sort";
import { buildScoreBreakdown } from "@/lib/desk-discovery/score-breakdown";
import { DISCOVERY_CONFIG } from "@/lib/desk-discovery/config";
import { DiscoveryPublishModal } from "@/components/admin/DiscoveryPublishModal";
import { DiscoveryScoreTooltip } from "@/components/admin/DiscoveryScoreTooltip";
import { cn } from "@/lib/utils";

/** Persists across card remounts so silent level fixes do not re-PATCH in a loop. */
const autoSanitizedDiscoveryIds = new Set<string>();

const SIGNAL_LABELS: Record<DiscoverySignalType, string> = {
  earnings_soon: "Earnings",
  news_catalyst: "News",
  volume_anomaly: "Volume",
  price_move: "Price",
  crypto_momentum: "Crypto",
  community_heat: "Community",
  recent_filing: "Filing",
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

function ActionMenu({
  items,
}: {
  items: Array<{ label: string; onClick: () => void; destructive?: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        aria-label="More actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </Button>
      {open ? (
        <ul className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-[var(--pf-border)] bg-white py-1 shadow-lg">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-xs font-medium hover:bg-[var(--pf-gray-50)]",
                  item.destructive ? "text-rose-600" : "text-[var(--pf-gray-700)]"
                )}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DiscoveryCandidateCard({
  row,
  filter,
  expanded,
  onExpandedChange,
  focused = false,
  selected = false,
  layout = "accordion",
  rowIndex,
  onSelect,
  publishRequested = false,
  onPublishHandled,
  onUpdated,
  onMessage,
  onError,
}: {
  row: DiscoveryCandidateRow;
  filter: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  focused?: boolean;
  selected?: boolean;
  layout?: "accordion" | "row" | "detail";
  rowIndex?: number;
  onSelect?: () => void;
  publishRequested?: boolean;
  onPublishHandled?: () => void;
  onUpdated: () => Promise<void>;
  onMessage: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [draft, setDraft] = useState<DiscoveryDraftPayload>(() => emptyDraft(row));
  const [draftLoading, setDraftLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
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

  useEffect(() => {
    if (publishRequested && isReady) {
      setPublishOpen(true);
      onPublishHandled?.();
    }
  }, [publishRequested, isReady, onPublishHandled]);
  const isHighScore = row.score >= DISCOVERY_CONFIG.highScoreNotifyThreshold;
  const scoreLines = buildScoreBreakdown(row.signalTypes, row.reasons);
  const uniqueReasons = row.reasons.filter(
    (r, i, arr) => arr.findIndex((x) => x.detail === r.detail) === i
  );
  const headline = row.headline ?? uniqueReasons[0]?.detail ?? "";
  const earnings = earningsLabel(row.reasons);
  const draftPreview =
    draft.thesis.trim().length >= 20
      ? [
          draft.direction.toUpperCase(),
          draft.entryNote ?? null,
          draft.thesis.trim().slice(0, 80) + (draft.thesis.length > 80 ? "…" : ""),
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

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
        onExpandedChange(true);
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

  const overflowItems: Array<{ label: string; onClick: () => void; destructive?: boolean }> = [];

  if (isInbox) {
    overflowItems.push({
      label: "Queue without draft",
      onClick: () => void patch({ status: "approved" }).then((ok) => ok && onMessage(`${row.symbol} queued to publish.`)),
    });
    overflowItems.push({
      label: "AI draft only",
      onClick: () => void runAiDraft(false),
    });
  }
  if (isReady) {
    overflowItems.push({
      label: "Regenerate AI",
      onClick: () => void runAiDraft(false),
    });
    overflowItems.push({
      label: "Back to Inbox",
      onClick: () => void patch({ status: "pending" }).then((ok) => ok && onMessage(`${row.symbol} moved back to Inbox.`)),
    });
  }
  if ((filter === "snoozed" || filter === "rejected") && !isReady && !isInbox) {
    overflowItems.push({
      label: "Restore to Inbox",
      onClick: () => void patch({ status: "pending" }).then((ok) => ok && onMessage(`${row.symbol} restored to Inbox.`)),
    });
  }
  if (!isPublished) {
    overflowItems.push({
      label: "Snooze 7 days",
      onClick: () => void patch({ status: "snoozed" }),
    });
    overflowItems.push({
      label: "Reject",
      onClick: () => void patch({ status: "rejected" }),
      destructive: true,
    });
  }

  const detailEditor = (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
          Signal details
        </p>
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
      </div>

      <div className="space-y-3 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)] p-3">
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
            rows={4}
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
            Publish preview: {formatDiscoveryDraftForPublish(draft).slice(0, 160)}
            {formatDiscoveryDraftForPublish(draft).length > 160 ? "…" : ""}
          </p>
        ) : null}
        {row.draft?.source === "template" ? (
          <p className="text-[10px] text-amber-800">
            Template draft — use Regenerate AI for research-backed copy.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving || draftLoading || draft.thesis.trim().length < 20}
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
              Save & queue
            </Button>
          ) : null}
          {isReady ? (
            <Button
              type="button"
              size="sm"
              disabled={draft.thesis.trim().length < 20}
              className="bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]"
              onClick={() => setPublishOpen(true)}
            >
              Publish
            </Button>
          ) : null}
          {isInbox ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={draftLoading}
              onClick={() => void runAiDraft(true)}
            >
              {draftLoading ? "Drafting…" : "AI draft & queue"}
            </Button>
          ) : isReady ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={draftLoading}
              onClick={() => void runAiDraft(false)}
            >
              {draftLoading ? "Drafting…" : "Regenerate AI"}
            </Button>
          ) : null}
          <ActionMenu items={overflowItems} />
        </div>
      </div>
    </div>
  );

  if (layout === "row") {
    return (
      <li data-discovery-row={rowIndex}>
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "flex w-full flex-col gap-1 border-b border-[var(--pf-border)] px-3 py-2.5 text-left transition-colors last:border-b-0",
            (selected || focused) &&
              "bg-[var(--pf-red-muted)]/30 ring-2 ring-inset ring-[var(--pf-red)]/25",
            !selected && !focused && "hover:bg-[var(--pf-gray-50)]"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--pf-black)]">{row.symbol}</span>
            <DiscoveryScoreTooltip score={row.score} lines={scoreLines} className="text-xs" />
            {isHighScore && isInbox ? (
              <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold uppercase text-amber-800">
                High
              </span>
            ) : null}
          </div>
          <p className="line-clamp-1 text-xs text-[var(--pf-gray-600)]">{headline}</p>
          {earnings ? (
            <p className="line-clamp-1 text-[10px] font-medium text-amber-800">{earnings}</p>
          ) : null}
        </button>
      </li>
    );
  }

  if (layout === "detail") {
    return (
      <div className="pf-workspace-panel flex min-h-[min(70dvh,40rem)] flex-col">
        <div className="border-b border-[var(--pf-border)] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/ticker/${row.symbol}`}
                  className="text-xl font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                >
                  {row.symbol}
                </Link>
                <DiscoveryScoreTooltip score={row.score} lines={scoreLines} />
                {row.draftGeneratedAt && !dirty ? (
                  <Badge variant={row.draft?.source === "template" ? "default" : "long"}>
                    {row.draft?.source === "template" ? "Template" : "AI draft"}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-[var(--pf-gray-600)]">{headline}</p>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{detailEditor}</div>
        {publishOpen && isReady ? (
          <DiscoveryPublishModal
            row={row}
            draft={draft}
            open={publishOpen}
            onClose={() => setPublishOpen(false)}
            onPublished={onUpdated}
          />
        ) : null}
      </div>
    );
  }

  return (
    <li
      className={cn(
        "bg-white px-4 py-4 sm:px-5",
        focused && "ring-2 ring-inset ring-[var(--pf-red)]/35 bg-[var(--pf-red-muted)]/20"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/ticker/${row.symbol}`}
              className="text-base font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
            >
              {row.symbol}
            </Link>
            <DiscoveryScoreTooltip score={row.score} lines={scoreLines} className="text-sm" />
            {isHighScore && isInbox ? (
              <Badge className="bg-amber-100 text-amber-800">High priority</Badge>
            ) : null}
            {row.draftGeneratedAt && !dirty ? (
              <Badge variant={row.draft?.source === "template" ? "default" : "long"}>
                {row.draft?.source === "template" ? "Template" : "AI draft"}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--pf-gray-600)]">{headline}</p>
          {earnings ? (
            <p className="mt-1 text-xs font-medium text-amber-800">{earnings}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {row.signalTypes.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-md border border-[var(--pf-border)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--pf-gray-500)]"
              >
                {SIGNAL_LABELS[t] ?? t}
              </span>
            ))}
            {row.signalTypes.length > 2 ? (
              <span className="text-[10px] font-medium text-[var(--pf-gray-400)]">
                +{row.signalTypes.length - 2}
              </span>
            ) : null}
          </div>
          {draftPreview ? (
            <p className="mt-2 line-clamp-1 text-xs text-[var(--pf-gray-500)]">{draftPreview}</p>
          ) : null}
        </div>

        {!isPublished ? (
          <div className="flex shrink-0 items-center gap-2">
            {isInbox ? (
              <Button
                type="button"
                size="sm"
                disabled={draftLoading}
                className="bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]"
                onClick={() => void runAiDraft(true)}
              >
                {draftLoading ? "Drafting…" : "AI draft & queue"}
              </Button>
            ) : null}
            {isReady ? (
              <Button
                type="button"
                size="sm"
                disabled={draft.thesis.trim().length < 20}
                className="bg-[var(--pf-red)] text-white hover:bg-[var(--pf-red-hover)]"
                onClick={() => setPublishOpen(true)}
              >
                Publish
              </Button>
            ) : null}
            <ActionMenu items={overflowItems} />
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onExpandedChange(!expanded)}
        className="mt-3 flex w-full items-center gap-1.5 text-left text-xs font-semibold text-[var(--pf-gray-500)] hover:text-[var(--foreground)]"
        aria-expanded={expanded}
      >
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-180")}
          strokeWidth={2.25}
        />
        {expanded ? "Hide details" : "Show signals & draft"}
      </button>

      {expanded ? (
        <div className="mt-3 space-y-4 border-t border-[var(--pf-border)] pt-4">{detailEditor}</div>
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
