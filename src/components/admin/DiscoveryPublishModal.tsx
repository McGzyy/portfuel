"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AdminModalShell } from "@/components/admin/AdminModalShell";
import type { DiscoveryCandidateRow } from "@/lib/desk-discovery/types";
import {
  formatDiscoveryDraftForPublish,
  parseLevelNote,
  type DiscoveryDraftPayload,
} from "@/lib/desk-discovery/draft-types";
import { sanitizeDiscoveryDraft } from "@/lib/desk-discovery/level-sanity";

export function DiscoveryPublishModal({
  row,
  draft,
  open,
  onClose,
  onPublished,
}: {
  row: DiscoveryCandidateRow;
  draft: DiscoveryDraftPayload;
  open: boolean;
  onClose: () => void;
  onPublished: () => Promise<void>;
}) {
  const router = useRouter();
  const [direction, setDirection] = useState(draft.direction);
  const [thesis, setThesis] = useState(formatDiscoveryDraftForPublish(draft));
  const [timeframeTag, setTimeframeTag] = useState(draft.timeframe);
  const [entry, setEntry] = useState("");
  const [target, setTarget] = useState("");
  const [stop, setStop] = useState("");
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [levelsAdjusted, setLevelsAdjusted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDirection(draft.direction);
    setThesis(formatDiscoveryDraftForPublish(draft));
    setTimeframeTag(draft.timeframe);
    setError("");
    setLevelsAdjusted(false);

    let cancelled = false;
    void (async () => {
      setLoadingQuote(true);
      try {
        const res = await fetch(
          `/api/symbols/validate?symbol=${encodeURIComponent(row.symbol)}&assetClass=${row.assetClass}`
        );
        const data = await res.json();
        if (cancelled) return;
        const last = typeof data.lastPrice === "number" ? data.lastPrice : null;
        setMarketPrice(last);

        const sanitized = sanitizeDiscoveryDraft(draft, last ?? undefined);
        const parsed = {
          entry: parseLevelNote(sanitized.entryNote),
          target: parseLevelNote(sanitized.targetNote),
          stop: parseLevelNote(sanitized.stopNote),
        };
        setEntry(String(parsed.entry ?? last ?? ""));
        setTarget(String(parsed.target ?? ""));
        setStop(String(parsed.stop ?? ""));
        setLevelsAdjusted(
          sanitized.entryNote !== draft.entryNote ||
            sanitized.targetNote !== draft.targetNote ||
            sanitized.stopNote !== draft.stopNote
        );
      } catch {
        if (!cancelled) setError("Could not load live quote.");
      } finally {
        if (!cancelled) setLoadingQuote(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, row.symbol, row.assetClass, draft]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: row.symbol,
          assetClass: row.assetClass,
          direction,
          thesis,
          entryMode: "live",
          targetPrice: target ? parseFloat(target) : undefined,
          stopPrice: stop ? parseFloat(stop) : undefined,
          timeframeTag: timeframeTag || undefined,
          discoveryCandidateId: row.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "entry_far_from_market") {
          setError("Entry is too far from the live quote — adjust levels and try again.");
        } else if (data.error === "levels_misaligned") {
          setError("Target/stop must align with direction (long: target above entry, stop below).");
        } else if (data.error === "discovery_not_ready") {
          setError("This symbol is no longer in the Ready queue.");
        } else {
          setError(typeof data.error === "string" ? data.error : "Publish failed.");
        }
        return;
      }
      onClose();
      await onPublished();
      router.push(`/ticker/${data.call.symbol}?published=1`);
      router.refresh();
    } catch {
      setError("Publish failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const subtitle =
    loadingQuote ? (
      "Loading live quote…"
    ) : marketPrice != null ? (
      <>
        Live ~${marketPrice.toFixed(2)}
        {levelsAdjusted ? " · levels adjusted to match quote" : ""}
      </>
    ) : undefined;

  return (
    <AdminModalShell
      open={open}
      onClose={onClose}
      titleId="discovery-publish-title"
      eyebrow="Publish Fueled call"
      title={row.symbol}
      subtitle={subtitle}
      footer={
        <div className="flex flex-wrap gap-2">
          <Button type="submit" form="discovery-publish-form" disabled={submitting || loadingQuote || thesis.trim().length < 10}>
            {submitting ? "Publishing…" : "Confirm & publish"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      }
    >
      <form id="discovery-publish-form" onSubmit={handlePublish} className="space-y-4">
        <SegmentedControl
          value={direction}
          onChange={(v) => setDirection(v as "long" | "short")}
          options={[
            { value: "long", label: "Long" },
            { value: "short", label: "Short" },
          ]}
        />
        <div className="space-y-1">
          <Label htmlFor="discovery-publish-thesis" className="text-xs">
            Thesis
          </Label>
          <Textarea
            id="discovery-publish-thesis"
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            rows={5}
            className="text-sm"
            required
            minLength={10}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="discovery-publish-entry" className="text-xs">
              Entry
            </Label>
            <Input
              id="discovery-publish-entry"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="text-sm"
              readOnly
              title="Live entry uses current market price on publish"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="discovery-publish-target" className="text-xs">
              Target
            </Label>
            <Input
              id="discovery-publish-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="text-sm"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="discovery-publish-stop" className="text-xs">
              Stop
            </Label>
            <Input
              id="discovery-publish-stop"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              className="text-sm"
              inputMode="decimal"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="discovery-publish-timeframe" className="text-xs">
            Timeframe
          </Label>
          <Input
            id="discovery-publish-timeframe"
            value={timeframeTag}
            onChange={(e) => setTimeframeTag(e.target.value)}
            className="text-sm"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
      </form>
    </AdminModalShell>
  );
}
