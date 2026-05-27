"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WatchlistMoveAlerts } from "@/components/dashboard/WatchlistMoveAlerts";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import type { LinePoint } from "@/lib/charts/types";
import { formatPct, formatPrice } from "@/lib/utils";
import { WATCHLIST_MOVE_ALERT_PCT } from "@/lib/watchlist/service";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { getDemoWatchlistSeed } from "@/lib/watchlist/demo";

const DEMO_STORAGE_KEY = "portfuel_demo_watchlist";

function loadDemoLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* ignore */
  }
  return [];
}

function saveDemoLocal(symbols: string[]) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(symbols));
}

function mergeDemoItems(serverItems: WatchlistEntry[]): WatchlistEntry[] {
  const local = loadDemoLocal();
  const seed = getDemoWatchlistSeed().map((s) => s.symbol);
  const allSymbols = [...new Set([...serverItems.map((i) => i.symbol), ...seed, ...local])];
  const bySymbol = new Map(serverItems.map((i) => [i.symbol, i]));
  const now = new Date().toISOString();
  return allSymbols.map((symbol) => {
    const existing = bySymbol.get(symbol);
    if (existing) return existing;
    const seedRow = getDemoWatchlistSeed().find((s) => s.symbol === symbol);
    return {
      symbol,
      asset_class: seedRow?.asset_class ?? "equity",
      created_at: now,
      last_price: null,
      return_pct: null,
    };
  });
}

export function WatchlistPanel({
  demoMode,
  proUnlocked = false,
}: {
  demoMode: boolean;
  proUnlocked?: boolean;
}) {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, LinePoint[]>>({});
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (!res.ok) {
        setError("Could not load watchlist.");
        return;
      }
      let list = (data.items ?? []) as WatchlistEntry[];
      if (demoMode) list = mergeDemoItems(list);
      setItems(list);
    } catch {
      setError("Could not load watchlist.");
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (items.length === 0) return;
    const symbols = items.map((i) => i.symbol).join(",");
    const controller = new AbortController();
    void fetch(`/api/market/sparklines?symbols=${encodeURIComponent(symbols)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { series?: Record<string, LinePoint[]> } | null) => {
        if (data?.series) setSparklines(data.series);
      })
      .catch(() => {
        /* ignore */
      });
    return () => controller.abort();
  }, [items]);

  async function addSymbol(e: React.FormEvent) {
    e.preventDefault();
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;

    if (demoMode) {
      const local = loadDemoLocal();
      if (!local.includes(sym)) {
        saveDemoLocal([sym, ...local]);
      }
      setSymbol("");
      await load();
      return;
    }

    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "watchlist_full"
            ? "Watchlist is full (24 max)."
            : "Could not add symbol."
        );
        return;
      }
      setItems(data.items ?? []);
      setSymbol("");
    } catch {
      setError("Could not add symbol.");
    } finally {
      setAdding(false);
    }
  }

  async function remove(sym: string) {
    if (demoMode) {
      const local = loadDemoLocal().filter((s) => s !== sym);
      saveDemoLocal(local);
      const seed = getDemoWatchlistSeed().map((s) => s.symbol);
      if (seed.includes(sym)) {
        setError("Demo seed symbols reset on refresh — remove custom adds only.");
        await load();
        return;
      }
      await load();
      return;
    }

    try {
      const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) setItems(data.items ?? []);
    } catch {
      setError("Could not remove.");
    }
  }

  return (
    <section
      className="rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white p-4 shadow-[var(--pf-shadow-sm)]"
      aria-label="Your watchlist"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Watchlist
      </p>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        Track tickers you care about — open{" "}
        <span className="font-semibold text-[var(--pf-gray-700)]">Chart &amp; intel</span> for live
        price, community calls, and desk context.
      </p>

      <form onSubmit={addSymbol} className="mt-3 flex gap-2">
        <Input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Add symbol"
          maxLength={12}
          className="font-mono text-sm"
          aria-label="Add to watchlist"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={adding}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {demoMode ? (
        <p className="mt-2 text-[10px] text-amber-700">
          Demo: adds save in your browser. Run the watchlist migration for persistent storage.
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      {!loading && items.length > 0 ? (
        <div className="mt-3">
          <WatchlistMoveAlerts items={items} proUnlocked={proUnlocked} />
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-400)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-500)]">No symbols yet. Add one above.</p>
      ) : (
        <ul className="mt-4 space-y-1">
          {items.map((item) => (
            <li
              key={item.symbol}
              className="group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 hover:border-[var(--pf-border)] hover:bg-[var(--pf-gray-50)]"
            >
              <MiniSparkline
                points={sparklines[item.symbol] ?? []}
                width={48}
                height={20}
                className="hidden sm:block"
              />
              <Link href={`/ticker/${item.symbol}`} className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
                    {item.symbol}
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    {item.change_since_add_pct != null ? (
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          item.change_since_add_pct >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                        title="Change since added to watchlist"
                      >
                        {(item.change_since_add_pct >= 0 ? "+" : "") +
                          formatPct(item.change_since_add_pct)}{" "}
                        since add
                      </span>
                    ) : null}
                    {item.return_pct != null ? (
                      <span className="text-[10px] font-medium tabular-nums text-[var(--pf-gray-500)]">
                        Call book {formatPct(item.return_pct)}
                      </span>
                    ) : null}
                  </span>
                </div>
                {item.last_price != null ? (
                  <p className="text-[10px] tabular-nums text-[var(--pf-gray-400)]">
                    ${formatPrice(Number(item.last_price))}
                    {proUnlocked &&
                    item.change_since_add_pct != null &&
                    Math.abs(item.change_since_add_pct) >= WATCHLIST_MOVE_ALERT_PCT ? (
                      <span className="ml-2 font-semibold text-amber-700">· Alert</span>
                    ) : null}
                  </p>
                ) : null}
              </Link>
              <Link
                href={`/ticker/${item.symbol}`}
                className="hidden shrink-0 items-center gap-1 rounded-full border border-[var(--pf-border)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--pf-gray-700)] transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)] group-hover:inline-flex sm:inline-flex"
                title={`${item.symbol} chart and intel`}
              >
                <LineChart className="h-3 w-3" aria-hidden />
                Intel
              </Link>
              <button
                type="button"
                onClick={() => remove(item.symbol)}
                className="rounded p-1 text-[var(--pf-gray-400)] opacity-0 transition-opacity hover:bg-[var(--pf-gray-100)] hover:text-[var(--pf-gray-700)] group-hover:opacity-100"
                aria-label={`Remove ${item.symbol}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
