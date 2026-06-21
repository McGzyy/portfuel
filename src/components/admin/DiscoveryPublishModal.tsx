"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[var(--pf-black)]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discovery-publish-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close publish dialog"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-surface)] shadow-xl sm:rounded-[var(--pf-radius-lg)]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--pf-border)] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pf-gray-400)]">
              Publish Fueled call
            </p>
            <h2 id="discovery-publish-title" className="text-lg font-bold text-[var(--pf-black)]">
              {row.symbol}
            </h2>
            {loadingQuote ? (
              <p className="text-xs text-[var(--pf-gray-500)]">Loading live quote…</p>
            ) : marketPrice != null ? (
              <p className="text-xs text-[var(--pf-gray-500)]">
                Live ~${marketPrice.toFixed(2)}
                {levelsAdjusted ? " · levels adjusted to match quote" : ""}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--pf-gray-600)] hover:bg-[var(--pf-gray-100)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <form onSubmit={handlePublish} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
          <div className="space-y-4">
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
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--pf-border)] pt-4">
            <Button type="submit" disabled={submitting || loadingQuote || thesis.trim().length < 10}>
              {submitting ? "Publishing…" : "Confirm & publish"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
