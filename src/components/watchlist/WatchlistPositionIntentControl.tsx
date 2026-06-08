"use client";

import { useState } from "react";
import { Crosshair } from "lucide-react";
import {
  POSITION_INTENT_OPTIONS,
  positionIntentLabel,
  type PositionIntent,
} from "@/lib/watchlist/position-intent";
import { normalizePositionIntent } from "@/lib/watchlist/journal-meta";
import type { WatchlistEntry } from "@/lib/watchlist/types";

const DEMO_STORAGE_KEY = "portfuel_demo_position_intent";

function loadDemoOverrides(): Record<string, PositionIntent> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PositionIntent>) : {};
  } catch {
    return {};
  }
}

function saveDemoOverride(symbol: string, intent: PositionIntent) {
  const map = loadDemoOverrides();
  map[symbol] = intent;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(map));
}

export function WatchlistPositionIntentControl({
  item,
  demoMode = false,
  onUpdated,
}: {
  item: WatchlistEntry;
  demoMode?: boolean;
  onUpdated?: (symbol: string, intent: PositionIntent) => void;
}) {
  const demoOverride = demoMode ? loadDemoOverrides()[item.symbol] : undefined;
  const intent = normalizePositionIntent(
    demoOverride ?? item.position_intent ?? "researching"
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(next: PositionIntent) {
    if (next === intent) return;
    setSaving(true);
    setError("");

    if (demoMode) {
      saveDemoOverride(item.symbol, next);
      onUpdated?.(item.symbol, next);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/watchlist/${encodeURIComponent(item.symbol)}/intent`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent: next }),
        }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(
          data.error === "schema_pending"
            ? "Run watchlist migrations first"
            : "Could not save"
        );
        return;
      }
      onUpdated?.(item.symbol, next);
    } catch {
      setError("Could not save");
    } finally {
      setSaving(false);
    }
  }

  const hint = POSITION_INTENT_OPTIONS.find((o) => o.value === intent)?.hint;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      title={hint}
    >
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pf-gray-500)]">
        <Crosshair className="h-2.5 w-2.5" aria-hidden />
        Posture
      </span>
      <select
        value={intent}
        disabled={saving}
        onChange={(e) => void save(e.target.value as PositionIntent)}
        className="max-w-[9.5rem] rounded border border-[var(--pf-border)] bg-[var(--pf-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--pf-gray-700)]"
        aria-label={`Trade posture for ${item.symbol}`}
      >
        {POSITION_INTENT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="sr-only">{positionIntentLabel(intent)}</span>
      {error ? <span className="text-[10px] text-rose-600">{error}</span> : null}
    </div>
  );
}
