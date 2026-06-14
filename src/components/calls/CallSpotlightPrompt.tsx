"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SPOTLIGHT_PROMPT_MIN_RETURN_PCT } from "@/lib/social/spotlight-config";

type SpotlightState = {
  status: string;
  chartUrl?: string;
  previewText?: string;
  tweetUrl?: string;
  returnPct?: number | null;
  symbol?: string;
};

export function CallSpotlightPrompt({
  callId,
  symbol,
  returnPct,
  className,
  onStatusChange,
}: {
  callId: string;
  symbol: string;
  returnPct: number | null;
  className?: string;
  onStatusChange?: () => void;
}) {
  const [state, setState] = useState<SpotlightState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calls/${callId}/spotlight`);
      if (res.ok) {
        setState((await res.json()) as SpotlightState);
      } else {
        setState({ status: "hidden" });
      }
    } catch {
      setState({ status: "hidden" });
    } finally {
      setLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    if ((returnPct ?? 0) >= SPOTLIGHT_PROMPT_MIN_RETURN_PCT) {
      void load();
    } else {
      setState({ status: "hidden" });
      setLoading(false);
    }
  }, [callId, returnPct, load]);

  async function confirm() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/calls/${callId}/spotlight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          allowHighlight: state?.status === "needs_opt_in" ? optIn : undefined,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        status?: string;
        tweetUrl?: string;
      };
      if (!res.ok) {
        setMessage(
          json.error === "opt_in_required"
            ? "Enable spotlight sharing to continue."
            : "Could not submit spotlight request. Try again."
        );
        return;
      }
      if (json.status === "posted") {
        setMessage("Featured on @PortFuel.");
      } else {
        setMessage("Request sent — @PortFuel will review and post when ready.");
      }
      await load();
      onStatusChange?.();
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    try {
      await fetch(`/api/calls/${callId}/spotlight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      await load();
      onStatusChange?.();
    } finally {
      setBusy(false);
    }
  }

  if (loading || !state || state.status === "hidden" || state.status === "declined") {
    return null;
  }

  if (state.status === "posted") {
    return (
      <div
        className={cn(
          "rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100",
          className
        )}
      >
        <span className="font-semibold">Featured on @PortFuel</span>
        {state.tweetUrl ? (
          <>
            {" · "}
            <a
              href={state.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-semibold underline"
            >
              View on X
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </>
        ) : null}
      </div>
    );
  }

  if (state.status === "pending_review") {
    return (
      <div
        className={cn(
          "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900",
          className
        )}
      >
        <span className="font-semibold">Spotlight requested</span> — @PortFuel is reviewing this
        call for the official feed.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 to-white px-3 py-3 dark:border-sky-800/60 dark:from-sky-950/30 dark:to-transparent",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-sky-900 dark:text-sky-100">
              Feature {symbol} on @PortFuel?
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-sky-800/80 dark:text-sky-200/80">
              Branded chart + thesis on the official PortFuel X account — not your personal profile.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            disabled={busy || (state.status === "needs_opt_in" && !optIn)}
            onClick={() => void confirm()}
            className="h-7 px-2.5 text-[11px]"
          >
            {busy ? "Sending…" : "Feature on @PortFuel"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void decline()}
            className="h-7 px-2 text-[11px] text-[var(--pf-gray-500)]"
          >
            Not now
          </Button>
        </div>
      </div>

      {state.status === "needs_opt_in" ? (
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-[11px] text-sky-900 dark:text-sky-100">
          <input
            type="checkbox"
            className="mt-0.5 accent-sky-600"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
          />
          <span>I authorize PortFuel to feature my qualifying calls on @PortFuel.</span>
        </label>
      ) : null}

      {message ? <p className="mt-2 text-[11px] font-medium text-emerald-700">{message}</p> : null}

      {state.chartUrl ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-semibold text-sky-700 underline dark:text-sky-300"
          >
            {expanded ? "Hide preview" : "Preview post"}
          </button>
          {expanded ? (
            <div className="mt-2 space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.chartUrl}
                alt={`${symbol} spotlight chart preview`}
                className="w-full max-w-md rounded-md border border-sky-200/80"
              />
              {state.previewText ? (
                <pre className="whitespace-pre-wrap rounded-md bg-black/5 p-2 text-[10px] leading-relaxed text-[var(--pf-gray-700)] dark:bg-white/5 dark:text-[var(--pf-gray-300)]">
                  {state.previewText}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
