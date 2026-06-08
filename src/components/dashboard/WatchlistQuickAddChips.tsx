"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ONBOARDING_DEFAULT_SYMBOLS } from "@/lib/onboarding/constants";
import { journalSymbolPath } from "@/lib/journal/paths";
import { watchlistAddErrorMessage } from "@/lib/watchlist/add-errors";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { cn } from "@/lib/utils";
import { useWatchlistItemsOptional } from "@/components/dashboard/WatchlistItemsProvider";

export function WatchlistQuickAddChips({
  existingSymbols: existingSymbolsProp,
  demoMode,
}: {
  existingSymbols: string[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const watchlistCtx = useWatchlistItemsOptional();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const existingSymbols = watchlistCtx?.items.map((i) => i.symbol) ?? existingSymbolsProp;
  const existing = new Set(existingSymbols.map((s) => s.toUpperCase()));
  const suggestions = ONBOARDING_DEFAULT_SYMBOLS.filter((s) => !existing.has(s)).slice(0, 6);

  if (suggestions.length === 0) return null;

  async function add(sym: string) {
    setBusy(sym);
    setError("");
    try {
      if (demoMode) {
        const key = "portfuel_demo_watchlist";
        const raw = localStorage.getItem(key);
        const local = raw ? (JSON.parse(raw) as string[]) : [];
        if (!local.includes(sym)) {
          localStorage.setItem(key, JSON.stringify([sym, ...local]));
        }
        router.push(journalSymbolPath(sym, { setup: true }));
        return;
      }

      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      const data = (await res.json()) as {
        error?: string;
        items?: WatchlistEntry[];
        partial?: boolean;
      };

      if (!res.ok) {
        setError(watchlistAddErrorMessage(data.error));
        return;
      }

      if (data.items && watchlistCtx) {
        watchlistCtx.setItems(data.items);
      } else if (data.partial) {
        router.refresh();
      }

      router.push(journalSymbolPath(sym, { setup: true }));
    } catch {
      setError("Could not add symbol — check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[var(--pf-gray-500)]">Quick add to watchlist:</span>
        {suggestions.map((sym) => (
          <button
            key={sym}
            type="button"
            disabled={busy === sym}
            onClick={() => void add(sym)}
            className={cn(
              "pf-pill-inactive rounded-full border px-3 py-1 font-mono text-xs font-semibold disabled:opacity-50"
            )}
          >
            {busy === sym ? "Adding…" : `+ ${sym}`}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
