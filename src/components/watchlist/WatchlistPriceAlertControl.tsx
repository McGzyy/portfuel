"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  PRICE_ALERT_PCT_OPTIONS,
  resolvePriceMoveThreshold,
} from "@/lib/alerts/price-threshold";
import type { WatchlistAlertPrefs } from "@/lib/alerts/preferences";
import type { WatchlistEntry } from "@/lib/watchlist/types";

const DEMO_STORAGE_KEY = "portfuel_demo_price_alerts";

function loadDemoOverrides(): Record<string, number | null> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number | null>) : {};
  } catch {
    return {};
  }
}

function saveDemoOverride(symbol: string, pct: number | null) {
  const map = loadDemoOverrides();
  if (pct == null) delete map[symbol];
  else map[symbol] = pct;
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(map));
}

export function WatchlistPriceAlertControl({
  item,
  globalPrefs,
  proUnlocked,
  demoMode = false,
  onUpdated,
}: {
  item: WatchlistEntry;
  globalPrefs: WatchlistAlertPrefs | null;
  proUnlocked: boolean;
  demoMode?: boolean;
  onUpdated?: (symbol: string, priceAlertPct: number | null) => void;
}) {
  const prefs = globalPrefs;
  const demoOverride = demoMode ? loadDemoOverrides()[item.symbol] : undefined;
  const symbolPct =
    demoOverride !== undefined ? demoOverride : item.price_alert_pct ?? null;

  const effective = prefs
    ? resolvePriceMoveThreshold(prefs, {
        symbolPriceAlertPct: symbolPct,
        proUnlocked,
      })
    : null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!prefs?.price_move) {
    return (
      <p className="mt-1 text-[10px] text-[var(--pf-gray-400)]">
        Price alerts off —{" "}
        <Link href="/dashboard/settings?section=notifications" className="font-semibold text-[var(--pf-red)] hover:underline">
          enable in Settings
        </Link>
      </p>
    );
  }

  async function save(next: number | null) {
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
        `/api/watchlist/${encodeURIComponent(item.symbol)}/price-alert`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceAlertPct: next }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "pro_required" ? "Pro required" : "Could not save");
        return;
      }
      onUpdated?.(item.symbol, next);
    } catch {
      setError("Could not save");
    } finally {
      setSaving(false);
    }
  }

  const isCustom = proUnlocked && symbolPct != null;

  return (
    <div
      className="mt-1.5 flex flex-wrap items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--pf-gray-500)]">
        <Bell className="h-2.5 w-2.5" aria-hidden />
        Alert
      </span>
      {proUnlocked ? (
        <select
          value={symbolPct ?? ""}
          disabled={saving}
          onChange={(e) => {
            const v = e.target.value;
            void save(v === "" ? null : Number(v));
          }}
          className="rounded border border-[var(--pf-border)] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[var(--pf-gray-700)]"
          aria-label={`Price alert threshold for ${item.symbol}`}
        >
          <option value="">Global ±{prefs.price_move_pct}%</option>
          {PRICE_ALERT_PCT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              ±{n}% custom
            </option>
          ))}
        </select>
      ) : (
        <span className="text-[10px] text-[var(--pf-gray-500)]">
          ±{effective ?? prefs.price_move_pct}% (global)
        </span>
      )}
      {isCustom ? (
        <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800">
          Custom
        </span>
      ) : null}
      {!proUnlocked ? (
        <Link
          href="/dashboard/settings?section=billing"
          className="text-[10px] font-semibold text-[var(--pf-red)] hover:underline"
        >
          Pro: per-symbol
        </Link>
      ) : null}
      {error ? <span className="text-[10px] text-rose-600">{error}</span> : null}
    </div>
  );
}
