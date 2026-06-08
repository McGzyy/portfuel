"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { journalSymbolPath } from "@/lib/journal/paths";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import type { WatchlistDigestResponse } from "@/lib/ai/watchlist-digest-types";

type Usage = {
  used: number;
  limit: number;
  remaining: number;
  configured: boolean;
};

export function WatchlistAiDigestPanel({
  locked,
  proGateCta,
  symbolCount,
}: {
  locked: boolean;
  proGateCta: ProGateCta;
  symbolCount: number;
}) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [digest, setDigest] = useState<WatchlistDigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUsage = useCallback(async () => {
    if (locked) return;
    try {
      const res = await fetch("/api/pro/watchlist-digest");
      const data = await res.json();
      if (res.ok) setUsage(data);
    } catch {
      /* ignore */
    }
  }, [locked]);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pro/watchlist-digest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "limit_reached"
            ? "Monthly digest limit reached."
            : data.error === "ai_not_configured"
              ? "AI is not configured in this environment."
              : data.error === "watchlist_empty"
                ? "Add symbols to your watchlist first."
                : "Could not generate digest."
        );
        if (data.usage) setUsage(data.usage);
        return;
      }
      setDigest(data.digest);
      if (data.usage) setUsage(data.usage);
    } catch {
      setError("Could not generate digest.");
    } finally {
      setLoading(false);
    }
  }

  const body = (
    <div className="pf-workspace-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" strokeWidth={2.25} />
            AI watchlist digest
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--pf-gray-500)]">
            On-demand summary of what changed on your symbols — thesis snippets, journal notes,
            moves, earnings, and headline activity.
          </p>
        </div>
        {usage ? (
          <p className="text-[10px] font-semibold tabular-nums text-[var(--pf-gray-500)]">
            {usage.remaining}/{usage.limit} left this month
          </p>
        ) : null}
      </div>

      {symbolCount === 0 ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-500)]">
          Add symbols on your watchlist to generate a digest.
        </p>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-4 gap-1.5"
          disabled={loading || (usage != null && usage.remaining <= 0)}
          onClick={() => void generate()}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          )}
          {loading ? "Summarizing…" : "Generate digest"}
        </Button>
      )}

      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}

      {digest ? (
        <div className="mt-4 space-y-4 rounded-[var(--pf-radius-lg)] border border-indigo-200/60 bg-indigo-50/40 p-4">
          <div>
            <p className="text-sm font-bold text-[var(--pf-black)]">{digest.headline}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--pf-gray-600)]">
              {digest.summary}
            </p>
          </div>
          {digest.highlights.length > 0 ? (
            <ul className="space-y-2">
              {digest.highlights.map((h) => (
                <li
                  key={h.symbol}
                  className="rounded-lg border border-[var(--pf-border)] bg-[var(--pf-surface)] px-3 py-2.5"
                >
                  <Link
                    href={journalSymbolPath(h.symbol)}
                    className="font-mono text-xs font-bold text-[var(--pf-red)] hover:underline"
                  >
                    {h.symbol}
                  </Link>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--pf-gray-800)]">
                    {h.headline}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--pf-gray-600)]">
                    {h.detail}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-[10px] leading-relaxed text-[var(--pf-gray-500)]">
            {digest.disclaimer}
          </p>
        </div>
      ) : null}
    </div>
  );

  return (
    <ProIntelligenceGate
      locked={locked}
      cta={proGateCta}
      variant="preview"
      title="AI watchlist digest"
      description="Pro summarizes what changed across your watchlist — journal notes, moves, earnings, and headlines in one pass."
    >
      {body}
    </ProIntelligenceGate>
  );
}
