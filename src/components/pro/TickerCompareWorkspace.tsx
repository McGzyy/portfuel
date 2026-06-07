"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { buildCompareHref } from "@/lib/dashboard/compare-symbols";
import { ProIntelligenceGate } from "@/components/pro/ProIntelligenceGate";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { ChartLoadingSkeleton } from "@/components/charts/ChartLoadingSkeleton";
import { CompareMultiLineChart } from "@/components/charts/CompareMultiLineChart";
import type { ProGateCta } from "@/lib/features/pro-intelligence";
import { buildCompareCallPriceLines } from "@/lib/charts/price-lines";
import { candlesToNormalizedLine, normalizePriceLines } from "@/lib/charts/normalize";
import type { CallWithUser } from "@/lib/db/supabase";
import type { CandlePoint, LinePoint, PriceLine } from "@/lib/charts/types";
import { formatPct } from "@/lib/utils";

type CompareSlot = {
  symbol: string;
  companyName: string;
  changePct: number | null;
  points: LinePoint[];
  priceLines: PriceLine[];
  callCount: number;
};

const MAX_SYMBOLS = 3;

const OVERLAY_LEGEND = [
  { label: "Desk", color: "#E31B23" },
  { label: "Your", color: "#475569" },
  { label: "Community", color: "#7c3aed" },
] as const;

export function TickerCompareWorkspace({
  locked,
  proGateCta,
  watchlistSymbols,
  initialSymbols,
  viewerUserId,
  syncUrl = false,
}: {
  locked: boolean;
  proGateCta: ProGateCta;
  watchlistSymbols: string[];
  initialSymbols?: string[];
  viewerUserId?: string | null;
  /** Keep /dashboard/compare?symbols= in sync for sharing and deep links. */
  syncUrl?: boolean;
}) {
  const [input, setInput] = useState("");
  const [symbols, setSymbols] = useState<string[]>(
    () => (initialSymbols?.length ? initialSymbols.slice(0, MAX_SYMBOLS) : watchlistSymbols.slice(0, 2))
  );
  const [slots, setSlots] = useState<CompareSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCallOverlays, setShowCallOverlays] = useState(true);

  const load = useCallback(async (syms: string[]) => {
    if (locked || syms.length < 2) {
      setSlots([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        syms.map(async (sym) => {
          const res = await fetch(`/api/tickers/${encodeURIComponent(sym)}/chart`);
          if (!res.ok) throw new Error(sym);
          const data = (await res.json()) as {
            symbol: string;
            companyName: string;
            quote: { changePct: number } | null;
            candles: CandlePoint[];
            calls: CallWithUser[];
          };
          const windowCandles = data.candles.slice(-90);
          const baseClose = windowCandles[0]?.close ?? 0;
          const absoluteLines = buildCompareCallPriceLines({
            calls: data.calls ?? [],
            viewerUserId,
          });
          return {
            symbol: data.symbol,
            companyName: data.companyName,
            changePct: data.quote?.changePct ?? null,
            points: candlesToNormalizedLine(windowCandles),
            priceLines: normalizePriceLines(absoluteLines, baseClose),
            callCount: data.calls?.length ?? 0,
          };
        })
      );
      setSlots(results);
    } catch {
      setError("Could not load one or more symbols. Check tickers and try again.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [locked, viewerUserId]);

  useEffect(() => {
    void load(symbols);
  }, [symbols, load]);

  useEffect(() => {
    if (!syncUrl || typeof window === "undefined") return;
    const href = buildCompareHref(symbols);
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== href) {
      window.history.replaceState(null, "", href);
    }
  }, [symbols, syncUrl]);

  function addSymbol(raw: string) {
    const sym = raw.toUpperCase().trim().replace(/[^A-Z0-9.-]/g, "");
    if (!sym || symbols.includes(sym) || symbols.length >= MAX_SYMBOLS) return;
    setSymbols([...symbols, sym]);
    setInput("");
  }

  function removeSymbol(sym: string) {
    setSymbols(symbols.filter((s) => s !== sym));
  }

  const hasOverlays = slots.some((s) => s.priceLines.length > 0);

  const body = (
    <div className="space-y-6">
      <div className="pf-workspace-panel p-5">
        <p className="text-sm text-[var(--pf-gray-600)]">
          Compare up to {MAX_SYMBOLS} symbols on the same % scale (3-month window). Pick from
          watchlist or enter a ticker.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {symbols.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => removeSymbol(sym)}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--pf-black)] bg-[var(--pf-black)] px-3 py-1 font-mono text-xs font-bold text-white"
            >
              {sym} ×
            </button>
          ))}
          {symbols.length < MAX_SYMBOLS ? (
            <form
              className="flex flex-1 flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addSymbol(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add symbol…"
                className="min-w-[8rem] flex-1 rounded-lg border border-[var(--pf-border)] px-3 py-1.5 font-mono text-sm uppercase"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--pf-gray-100)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--pf-gray-200)]"
              >
                Add
              </button>
            </form>
          ) : null}
        </div>
        {watchlistSymbols.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-semibold uppercase text-[var(--pf-gray-400)]">
              Watchlist:
            </span>
            {watchlistSymbols.slice(0, 8).map((sym) => (
              <button
                key={sym}
                type="button"
                disabled={symbols.includes(sym) || symbols.length >= MAX_SYMBOLS}
                onClick={() => addSymbol(sym)}
                className="rounded-full border border-[var(--pf-border)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--pf-gray-600)] hover:border-[var(--pf-gray-300)] disabled:opacity-40"
              >
                {sym}
              </button>
            ))}
          </div>
        ) : null}
        {symbols.length < 2 ? (
          <p className="mt-3 text-xs text-amber-700">Add at least two symbols to compare.</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[var(--pf-red)]">{error}</p> : null}

      {loading ? (
        <ChartLoadingSkeleton height={320} />
      ) : slots.length >= 2 ? (
        <ChartFrame
          title="Synced compare"
          subtitle="Shared time scale and crosshair · % change from 3-month start"
        >
          {hasOverlays ? (
            <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[var(--pf-gray-600)]">
              <input
                type="checkbox"
                checked={showCallOverlays}
                onChange={(e) => setShowCallOverlays(e.target.checked)}
                className="rounded border-[var(--pf-border)]"
              />
              Show call entry / target overlays
            </label>
          ) : null}
          <CompareMultiLineChart
            series={slots.map((s) => ({
              symbol: s.symbol,
              points: s.points,
              priceLines: showCallOverlays ? s.priceLines : undefined,
            }))}
            height={320}
          />
          {showCallOverlays && hasOverlays ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--pf-border)] pt-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
                Overlays
              </span>
              {OVERLAY_LEGEND.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5 text-[10px] text-[var(--pf-gray-600)]">
                  <span
                    className="h-0.5 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label} entry / target
                </span>
              ))}
              <span className="text-[10px] text-[var(--pf-gray-400)]">
                Normalized to each symbol&apos;s 3-month start
              </span>
            </div>
          ) : null}
        </ChartFrame>
      ) : null}

      {!loading && slots.length >= 2 ? (
        <div
          className={
            slots.length === 2
              ? "grid gap-4 md:grid-cols-2"
              : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          }
        >
          {slots.map((slot) => (
            <div key={slot.symbol} className="pf-workspace-panel overflow-hidden p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/ticker/${slot.symbol}`}
                    className="font-mono text-base font-bold text-[var(--pf-black)] hover:text-[var(--pf-red)]"
                  >
                    {slot.symbol}
                  </Link>
                  <p className="truncate text-xs text-[var(--pf-gray-500)]">{slot.companyName}</p>
                </div>
                {slot.changePct != null ? (
                  <span
                    className={
                      slot.changePct >= 0
                        ? "text-xs font-bold tabular-nums text-emerald-600"
                        : "text-xs font-bold tabular-nums text-rose-600"
                    }
                  >
                    {formatPct(slot.changePct)}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[10px] text-[var(--pf-gray-400)]">
                Today&apos;s move
                {slot.callCount > 0 ? (
                  <>
                    {" · "}
                    <Link href={`/ticker/${slot.symbol}`} className="text-[var(--pf-red)] hover:underline">
                      {slot.callCount} call{slot.callCount === 1 ? "" : "s"}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <ProIntelligenceGate
      locked={locked}
      cta={proGateCta}
      title="Ticker compare"
      description="Line up 2–3 symbols on the same performance scale — Pro Intelligence."
    >
      {body}
    </ProIntelligenceGate>
  );
}
