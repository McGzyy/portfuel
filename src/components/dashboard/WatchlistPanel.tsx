"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, LineChart, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JournalProgressMini } from "@/components/journal/JournalProgressMini";
import { WatchlistMoveAlerts } from "@/components/dashboard/WatchlistMoveAlerts";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import type { LinePoint } from "@/lib/charts/types";
import { formatPct, formatPrice } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { journalSymbolPath } from "@/lib/journal/paths";
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
  initialItems,
}: {
  demoMode: boolean;
  proUnlocked?: boolean;
  initialItems?: WatchlistEntry[];
}) {
  const [items, setItems] = useState<WatchlistEntry[]>(initialItems ?? []);
  const [sparklines, setSparklines] = useState<Record<string, LinePoint[]>>({});
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(initialItems == null);
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
    if (initialItems != null) {
      let list = initialItems;
      if (demoMode) list = mergeDemoItems(list);
      setItems(list);
      setLoading(false);
      return;
    }
    load();
  }, [load, initialItems, demoMode]);

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
      router.push(journalSymbolPath(sym, { setup: true }));
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
      router.push(journalSymbolPath(sym, { setup: true }));
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
      className="pf-workspace-panel p-4 sm:p-5"
      aria-label="Your watchlist"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Your symbols
      </p>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        Track tickers for alerts and quick intel — you&apos;ll land in Journal to draft your thesis.
      </p>

      <form onSubmit={addSymbol} className="mt-3">
        <div className="flex gap-2">
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Add symbol"
            maxLength={12}
            className="font-mono text-sm"
            aria-label="Add to watchlist"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={adding} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">
              {adding ? "Adding…" : COPY.journalAddSymbol}
            </span>
          </Button>
        </div>
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
              <Link
                href={journalSymbolPath(item.symbol)}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--pf-black)]">
                    {item.symbol}
                    {!item.has_thesis ? (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Needs thesis
                      </span>
                    ) : item.journal_progress?.ready_to_publish ? (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Ready
                      </span>
                    ) : null}
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
                {item.last_price != null || item.community_calls_7d || item.has_unread_call_alert ? (
                  <p className="text-[10px] tabular-nums text-[var(--pf-gray-400)]">
                    {item.last_price != null ? (
                      <>${formatPrice(Number(item.last_price))}</>
                    ) : null}
                    {item.has_unread_call_alert ? (
                      <span className="ml-2 inline-flex items-center gap-0.5 font-semibold text-[var(--pf-red)]">
                        <Bell className="h-2.5 w-2.5" aria-hidden />
                        New community call
                      </span>
                    ) : (item.community_calls_7d ?? 0) > 0 ? (
                      <span className="ml-2 font-medium text-[var(--pf-gray-600)]">
                        · {item.community_calls_7d} member call
                        {item.community_calls_7d === 1 ? "" : "s"} (7d)
                      </span>
                    ) : null}
                    {proUnlocked &&
                    item.change_since_add_pct != null &&
                    Math.abs(item.change_since_add_pct) >= WATCHLIST_MOVE_ALERT_PCT ? (
                      <span className="ml-2 font-semibold text-amber-700">· Price alert</span>
                    ) : !proUnlocked && item.asset_class === "equity" ? (
                      <span className="ml-2 font-medium text-[var(--pf-red)]">
                        · Pro: news & filings
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {item.journal_progress ? (
                  <JournalProgressMini progress={item.journal_progress} className="mt-1.5" />
                ) : null}
              </Link>
              <Link
                href={journalSymbolPath(item.symbol)}
                className="hidden shrink-0 items-center gap-1 rounded-full border border-[var(--pf-border)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--pf-gray-700)] transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)] group-hover:inline-flex sm:inline-flex"
                title={`${item.symbol} research journal`}
              >
                <BookOpen className="h-3 w-3" aria-hidden />
                Journal
              </Link>
              <Link
                href={`/ticker/${item.symbol}`}
                className="hidden shrink-0 items-center gap-1 rounded-full border border-[var(--pf-border)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--pf-gray-500)] transition-colors hover:border-[var(--pf-gray-300)] hover:bg-[var(--pf-gray-50)] group-hover:inline-flex sm:inline-flex"
                title={`${item.symbol} community intel`}
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
