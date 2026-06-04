"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ONBOARDING_DEFAULT_SYMBOLS } from "@/lib/onboarding/constants";
import { cn } from "@/lib/utils";

export function WatchlistQuickAddChips({
  existingSymbols,
  demoMode,
}: {
  existingSymbols: string[];
  demoMode: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const existing = new Set(existingSymbols.map((s) => s.toUpperCase()));
  const suggestions = ONBOARDING_DEFAULT_SYMBOLS.filter((s) => !existing.has(s)).slice(0, 6);

  if (suggestions.length === 0) return null;

  async function add(sym: string) {
    setBusy(sym);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      if (res.ok || demoMode) {
        router.refresh();
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-[var(--pf-gray-500)]">Quick add:</span>
      {suggestions.map((sym) => (
        <button
          key={sym}
          type="button"
          disabled={busy === sym}
          onClick={() => void add(sym)}
          className={cn(
            "rounded-full border border-[var(--pf-border)] bg-white px-3 py-1 font-mono text-xs font-semibold text-[var(--pf-gray-700)]",
            "hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)] disabled:opacity-50"
          )}
        >
          {busy === sym ? "…" : `+ ${sym}`}
        </button>
      ))}
    </div>
  );
}
