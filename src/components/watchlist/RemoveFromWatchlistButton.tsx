"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import type { WatchlistRemoveSummary } from "@/lib/watchlist/journal-archive";
import { cn } from "@/lib/utils";

function buildRemoveMessage(summary: WatchlistRemoveSummary): {
  title: string;
  body: string;
  caution: string | null;
} {
  const { symbol, entryCount, revisionCount, hasResearch } = summary;
  const title = `Remove ${symbol} from watchlist?`;

  if (!hasResearch) {
    return {
      title,
      body: `${symbol} will disappear from your watchlist and earnings calendar. You can add it again anytime.`,
      caution: null,
    };
  }

  const parts: string[] = [];
  if (summary.hasThesis || summary.hasPlanFields) {
    parts.push("your thesis and plan");
  }
  if (entryCount > 0) {
    parts.push(`${entryCount} journal entr${entryCount === 1 ? "y" : "ies"}`);
  }
  if (revisionCount > 0) {
    parts.push(`${revisionCount} plan edit log record${revisionCount === 1 ? "" : "s"}`);
  }

  return {
    title,
    body: `${symbol} will be removed from your watchlist. Your private research is saved and will come back if you add ${symbol} again.`,
    caution: `This includes ${parts.join(", ")}.`,
  };
}

export function RemoveFromWatchlistButton({
  symbol,
  variant = "icon",
  className,
  redirectTo,
  onRemoved,
}: {
  symbol: string;
  variant?: "icon" | "button";
  className?: string;
  /** Navigate here after a successful remove (e.g. journal hub). */
  redirectTo?: string;
  onRemoved?: (items: WatchlistEntry[]) => void;
}) {
  const router = useRouter();
  const sym = symbol.toUpperCase();
  const [open, setOpen] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [summary, setSummary] = useState<WatchlistRemoveSummary | null>(null);
  const [error, setError] = useState("");

  const close = useCallback(() => {
    if (removing) return;
    setOpen(false);
    setError("");
  }, [removing]);

  async function openDialog() {
    setOpen(true);
    setLoadingSummary(true);
    setError("");
    setSummary(null);
    try {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(sym)}/remove-summary`);
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load remove details.");
        return;
      }
      setSummary(data.summary as WatchlistRemoveSummary);
    } catch {
      setError("Could not load remove details.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function confirmRemove() {
    setRemoving(true);
    setError("");
    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "archive_failed"
            ? "Could not save your journal backup before removing. Try again in a minute — if it keeps failing, contact support."
            : "Could not remove from watchlist."
        );
        return;
      }
      const items = data.partial
        ? []
        : ((data.items ?? []) as WatchlistEntry[]);
      onRemoved?.(items);
      setOpen(false);
      router.refresh();
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch {
      setError("Could not remove from watchlist.");
    } finally {
      setRemoving(false);
    }
  }

  const copy = summary ? buildRemoveMessage(summary) : null;

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => void openDialog()}
          className={cn(
            "rounded-full p-1.5 text-[var(--pf-gray-400)] transition-colors hover:bg-rose-50 hover:text-rose-700",
            className
          )}
          aria-label={`Remove ${sym} from watchlist`}
          title="Remove from watchlist"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void openDialog()}
          className={cn(
            "gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800",
            className
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove from watchlist
        </Button>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[var(--pf-black)]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="watchlist-remove-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="pf-modal-sheet w-full max-w-md rounded-t-[1.25rem] border border-[var(--pf-border)] p-5 shadow-xl sm:rounded-[var(--pf-radius-lg)]">
            {loadingSummary ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--pf-red)]" />
              </div>
            ) : copy ? (
              <>
                <h2
                  id="watchlist-remove-title"
                  className="text-lg font-bold text-[var(--pf-black)]"
                >
                  {copy.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--pf-gray-600)]">
                  {copy.body}
                </p>
                {copy.caution ? (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                    {copy.caution} Nothing is published to the community — research stays private
                    and is restored when you re-add this symbol.
                  </p>
                ) : null}
                {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={close} disabled={removing}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700"
                    disabled={removing}
                    onClick={() => void confirmRemove()}
                  >
                    {removing ? "Removing…" : "Remove from watchlist"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-rose-600">{error || "Could not load remove details."}</p>
                <div className="mt-4 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={close}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
