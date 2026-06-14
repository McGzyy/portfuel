"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, LineChart, Plus, X } from "lucide-react";
import { RemoveFromWatchlistButton } from "@/components/watchlist/RemoveFromWatchlistButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JournalProgressMini } from "@/components/journal/JournalProgressMini";
import { WatchlistMoveAlerts } from "@/components/dashboard/WatchlistMoveAlerts";
import { WatchlistPositionIntentControl } from "@/components/watchlist/WatchlistPositionIntentControl";
import { PositionIntentBadge } from "@/components/watchlist/PositionIntentBadge";
import { WatchlistPriceAlertControl } from "@/components/watchlist/WatchlistPriceAlertControl";
import type { PositionIntent } from "@/lib/watchlist/position-intent";
import { WatchlistIntelSnippet } from "@/components/watchlist/WatchlistIntelSnippet";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import type { LinePoint } from "@/lib/charts/types";
import { formatPct, formatPrice } from "@/lib/utils";
import { COPY } from "@/lib/copy";
import { journalSymbolPath } from "@/lib/journal/paths";
import { tickerPagePath } from "@/lib/market/ticker-path";
import { resolvePriceMoveThreshold } from "@/lib/alerts/price-threshold";
import type { WatchlistAlertPrefs } from "@/lib/alerts/preferences";
import { DEFAULT_WATCHLIST_ALERT_PREFS } from "@/lib/alerts/preferences";
import { ErrorMessageWithSupport } from "@/components/help/SupportContactLink";
import { watchlistAddErrorMessage } from "@/lib/watchlist/add-errors";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { useWatchlistItemsOptional } from "@/components/dashboard/WatchlistItemsProvider";
import { useProQuoteRefresh } from "@/hooks/useProQuoteRefresh";
import { MarketDataNote } from "@/components/market/MarketDataNote";
import { pickLatestTimestamp } from "@/lib/market/quote-freshness";
import { getDemoWatchlistSeed } from "@/lib/watchlist/demo";

const DEMO_STORAGE_KEY = "portfuel_demo_watchlist";

function formatWatchlistPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—";
  return `$${formatPrice(value)}`;
}

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
  alertPrefs,
}: {
  demoMode: boolean;
  proUnlocked?: boolean;
  initialItems?: WatchlistEntry[];
  alertPrefs?: WatchlistAlertPrefs | null;
}) {
  const watchlistCtx = useWatchlistItemsOptional();
  const [items, setItems] = useState<WatchlistEntry[]>(initialItems ?? []);
  const [sparklines, setSparklines] = useState<Record<string, LinePoint[]>>({});
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(initialItems == null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const globalPrefs = alertPrefs ?? DEFAULT_WATCHLIST_ALERT_PREFS;
  const quotesUpdatedAt = useMemo(
    () => pickLatestTimestamp(items.map((i) => i.quote_updated_at)),
    [items]
  );
  const initialKey = useMemo(
    () => (initialItems ?? []).map((i) => i.symbol).join(","),
    [initialItems]
  );

  function patchItemPriceAlert(symbol: string, priceAlertPct: number | null) {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.symbol === symbol ? { ...i, price_alert_pct: priceAlertPct } : i
      );
      watchlistCtx?.setItems(next);
      return next;
    });
  }

  function patchItemPositionIntent(symbol: string, positionIntent: PositionIntent) {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.symbol === symbol ? { ...i, position_intent: positionIntent } : i
      );
      watchlistCtx?.setItems(next);
      return next;
    });
  }

  function applyItems(list: WatchlistEntry[]) {
    setItems(list);
    watchlistCtx?.setItems(list);
  }

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
      applyItems(list);
    } catch {
      setError("Could not load watchlist.");
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    if (initialItems == null) {
      void load();
      return;
    }
    let list = initialItems;
    if (demoMode) list = mergeDemoItems(list);
    setItems(list);
    watchlistCtx?.setItems(list);
    setLoading(false);
    // Sync from server only when the symbol set changes — not when client removes a row.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- watchlistCtx.setItems is stable enough
  }, [load, initialKey, demoMode]);

  useEffect(() => {
    if (items.length === 0) return;
    const symbols = items.map((i) => i.symbol).join(",");
    const crypto = items
      .filter((i) => i.asset_class === "crypto")
      .map((i) => i.symbol)
      .join(",");
    const query = new URLSearchParams({ symbols });
    if (crypto) query.set("crypto", crypto);
    const controller = new AbortController();
    void fetch(`/api/market/sparklines?${query.toString()}`, {
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

  const refreshProQuotes = useCallback(async () => {
    if (!proUnlocked) return;
    try {
      const res = await fetch("/api/pro/refresh-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await load();
        router.refresh();
      }
    } catch {
      /* ignore */
    }
  }, [proUnlocked, load, router]);

  useProQuoteRefresh({ enabled: proUnlocked, onRefresh: refreshProQuotes });

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
        setError(watchlistAddErrorMessage(data.error));
        return;
      }
      if (data.partial) {
        await load();
        router.refresh();
      } else {
        applyItems((data.items ?? []) as WatchlistEntry[]);
      }
      setSymbol("");
      router.push(journalSymbolPath(sym, { setup: true }));
    } catch {
      setError("Could not add symbol.");
    } finally {
      setAdding(false);
    }
  }

  async function removeDemo(sym: string) {
    const local = loadDemoLocal().filter((s) => s !== sym);
    saveDemoLocal(local);
    const seed = getDemoWatchlistSeed().map((s) => s.symbol);
    if (seed.includes(sym)) {
      setError("Demo seed symbols reset on refresh — remove custom adds only.");
    }
    await load();
  }

  return (
    <section
      className="pf-workspace-panel flex h-full flex-col p-4 sm:p-5"
      aria-label="Your watchlist"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        Your watchlist
      </p>
      <p className="mt-1 text-xs text-[var(--pf-gray-500)]">
        Step 1 — add tickers you want to research. We open your private journal so you can draft a
        thesis, plan levels, and log entries over time.
      </p>
      <MarketDataNote
        className="mt-2"
        isPro={proUnlocked}
        updatedAt={quotesUpdatedAt}
      />

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

      {error ? (
        <p className="mt-2 text-xs text-rose-600">
          <ErrorMessageWithSupport message={error} />
        </p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="mt-3">
          <WatchlistMoveAlerts
            items={items}
            proUnlocked={proUnlocked}
            globalPrefs={globalPrefs}
          />
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-400)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--pf-gray-500)]">No symbols yet. Add one above.</p>
      ) : (
        <ul className="mt-4 flex-1 space-y-3">
          {items.map((item) => {
            const moveThreshold = resolvePriceMoveThreshold(globalPrefs, {
              symbolPriceAlertPct: item.price_alert_pct,
              proUnlocked,
            });
            const showMoveHint =
              moveThreshold != null &&
              item.change_since_add_pct != null &&
              Math.abs(item.change_since_add_pct) >= moveThreshold;
            const isCrypto = item.asset_class === "crypto";

            return (
            <li
              key={item.symbol}
              className="group pf-watchlist-row rounded-xl p-3"
            >
              <div className="flex items-start gap-3">
                <MiniSparkline
                  points={sparklines[item.symbol] ?? []}
                  width={56}
                  height={28}
                  className="pf-sparkline-pad mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={journalSymbolPath(item.symbol)} className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-[var(--pf-black)]">
                          {item.symbol}
                        </span>
                        {isCrypto ? (
                          <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                            Crypto
                          </span>
                        ) : (
                          <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                            Stock
                          </span>
                        )}
                        {!item.has_thesis ? (
                          <span className="pf-badge-attention">
                            Needs thesis
                          </span>
                        ) : item.journal_progress?.ready_to_publish ? (
                          <span className="pf-badge-ready">Ready</span>
                        ) : null}
                        {item.position_intent && item.position_intent !== "researching" ? (
                          <PositionIntentBadge intent={item.position_intent} />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--pf-black)]">
                        {formatWatchlistPrice(
                          item.last_price != null ? Number(item.last_price) : null
                        )}
                      </p>
                    </Link>
                    <div className="shrink-0 text-right">
                      {item.change_since_add_pct != null ? (
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            item.change_since_add_pct >= 0 ? "pf-return-up" : "pf-return-down"
                          }`}
                          title="Change since added to watchlist"
                        >
                          {(item.change_since_add_pct >= 0 ? "+" : "") +
                            formatPct(item.change_since_add_pct)}{" "}
                          <span className="font-medium text-[var(--pf-gray-400)]">since add</span>
                        </span>
                      ) : null}
                      {item.user_call?.return_pct != null ? (
                        <Link
                          href={tickerPagePath(item.symbol, item.asset_class)}
                          className={`mt-0.5 block text-[10px] font-semibold tabular-nums hover:underline ${
                            item.user_call.return_pct >= 0 ? "pf-return-up" : "pf-return-down"
                          }`}
                          title="Open your call on ticker intel"
                        >
                          Your call{" "}
                          {(item.user_call.return_pct >= 0 ? "+" : "") +
                            formatPct(item.user_call.return_pct)}
                        </Link>
                      ) : item.return_pct != null ? (
                        <Link
                          href={tickerPagePath(item.symbol, item.asset_class)}
                          className="mt-0.5 block text-[10px] font-medium tabular-nums text-[var(--pf-gray-500)] hover:underline"
                          title="Community calls on this symbol"
                        >
                          Community {formatPct(item.return_pct)}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <Link href={journalSymbolPath(item.symbol)} className="block">

                    {item.has_unread_call_alert || (item.community_calls_7d ?? 0) > 0 || showMoveHint ? (
                      <p className="mt-1.5 text-[10px] text-[var(--pf-gray-500)]">
                        {item.has_unread_call_alert ? (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--pf-red)]">
                            <Bell className="h-2.5 w-2.5" aria-hidden />
                            New community call
                          </span>
                        ) : (item.community_calls_7d ?? 0) > 0 ? (
                          <span className="font-medium text-[var(--pf-gray-600)]">
                            {item.community_calls_7d} member call
                            {item.community_calls_7d === 1 ? "" : "s"} (7d)
                          </span>
                        ) : null}
                        {proUnlocked && showMoveHint ? (
                          <span className="font-semibold text-amber-700"> · Price alert</span>
                        ) : null}
                      </p>
                    ) : null}

                    <WatchlistIntelSnippet item={item} proUnlocked={proUnlocked} />
                    {item.journal_progress ? (
                      <JournalProgressMini progress={item.journal_progress} className="mt-2" />
                    ) : null}
                  </Link>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--pf-border)]/70 pt-2">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <WatchlistPositionIntentControl
                        item={item}
                        demoMode={demoMode}
                        onUpdated={patchItemPositionIntent}
                      />
                      <WatchlistPriceAlertControl
                        item={item}
                        globalPrefs={globalPrefs}
                        proUnlocked={proUnlocked}
                        demoMode={demoMode}
                        onUpdated={patchItemPriceAlert}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={journalSymbolPath(item.symbol)}
                        className="pf-chip-action"
                        title={`${item.symbol} research journal`}
                      >
                        <BookOpen className="h-3 w-3" aria-hidden />
                        Journal
                      </Link>
                      <Link
                        href={tickerPagePath(item.symbol, item.asset_class)}
                        className="pf-chip-action pf-chip-action-muted"
                        title={`${item.symbol} community intel`}
                      >
                        <LineChart className="h-3 w-3" aria-hidden />
                        Intel
                      </Link>
                      {demoMode ? (
                        <button
                          type="button"
                          onClick={() => void removeDemo(item.symbol)}
                          className="rounded-full p-1.5 text-[var(--pf-gray-400)] transition-colors hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Remove ${item.symbol} from watchlist`}
                          title="Remove from watchlist"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <RemoveFromWatchlistButton
                          symbol={item.symbol}
                          onRemoved={(list) => applyItems(list)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
