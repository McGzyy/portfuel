# Charts & graphs (PortFuel)

Charts are the **visual spine** of the product. **Do not add one-off chart libraries per page** — extend the shared stack below.

Product roadmap context: [VALUE-ROADMAP.md](./VALUE-ROADMAP.md) → **Charts & graphs — flagship initiative**.

---

## Current stack

| Layer | Choice | Where |
|-------|--------|--------|
| Price (OHLC) | [lightweight-charts](https://tradingview.github.io/lightweight-charts/) v5 | `src/components/charts/TickerChart.tsx` |
| Theme | `src/lib/charts/theme.ts` | Colors, grid, fonts (`--pf-*`) |
| Container | `ChartFrame`, `ChartRangeToolbar`, skeleton | `src/components/charts/` |
| Data | Finnhub candles + call markers | `src/lib/market/ticker-intel.ts` |
| Client boundary | `TickerChartClient` (dynamic, no SSR) | `TickerChartSection` |

Ticker pages: candlesticks + member call markers. Styling: `pf-ticker-chart-frame` in `globals.css`.

---

## Principles

1. **Server fetches, client renders** — candles/quotes/aggregates from API or RSC; chart components stay `"use client"`.
2. **Shared theme** — all charts import `chartTheme` (no hardcoded hex in components).
3. **Shared container** — `ChartFrame` (title, subtitle, legend, loading, empty).
4. **Resize-safe** — `ResizeObserver` on container (`TickerChart` pattern).
5. **Performance** — cap points (~500 candles); downsample sparklines.
6. **Calls > indicators** — entry/target/stop and attributed markers beat indicator overload.

---

## Shipped surfaces ✅

| Surface | Component | Notes |
|---------|-----------|--------|
| Ticker | `TickerChartSection` | Range toolbar 1M–ALL, call markers, price lines (G1) |
| Hot tickers / watchlist / feed / overview | `MiniSparkline`, `SparklineProvider` | Batched 30d closes (G2) |
| Rankings | `RankScoreBar` | Relative score bar (G2) |
| Profile / member | `MemberReturnChart` | Cumulative return from calls |
| Own profile | Same + distribution | `MemberReturnDistribution` (Pro) |
| Overview | `OverviewPerformanceChart` | Workspace sparkline |
| Compare (Pro) | `TickerCompareWorkspace` | Normalized lines, 2–3 symbols |
| Admin | `AdminDailyChart` | Signups & calls/day |

---

## Phase G1 — Ticker truth (start here)

**Goal:** The ticker chart is the canonical PortFuel chart — everything else should feel like a sibling.

| Task | Detail |
|------|--------|
| Price lines | Horizontal lines for **entry**, **target**, **stop** on the viewer’s own call (and optional desk thesis levels). |
| Marker taxonomy | Distinct shapes/colors: member long/short, Fueled desk, community cluster. |
| Interaction | Crosshair shows OHLC + nearest call label; click marker scrolls to thesis block. |
| Legend | `TickerChartLegend` lists marker types + count in range. |
| Empty / loading | Skeleton + “no candles” states match `ChartFrame` everywhere. |

**Data:** extend `ChartMarker` or add `PriceLine` type in `src/lib/charts/types.ts`; build series in `ticker-intel.ts` or ticker page from `calls` row.

---

## Phase G2 — Workspace rhythm ✅

**Goal:** Overview, watchlist, feed, and rankings share the same mini-chart DNA.

| Task | Status |
|------|--------|
| `MiniSparkline` + `SparklineProvider` | ✅ Batched fetch, lazy on feed |
| Hot tickers | ✅ |
| Watchlist rows | ✅ |
| Feed cards + overview previews + following | ✅ Right-rail sparkline |
| Rankings | ✅ `RankScoreBar` vs leader |

---

## Phase G3 — Track record story ✅

| Task | Status |
|------|--------|
| Profile curve | ✅ Win/loss markers, max drawdown stat, `ReturnChartPoint` |
| Desk aggregate | ✅ `DeskPortfolioChart` equal-weight basket curve |
| Deep link | ✅ Click point → `/ticker/[symbol]` |

---

## Phase G4 — Pro terminal ✅

| Task | Status |
|------|--------|
| Compare sync | ✅ `CompareMultiLineChart` — shared scale + crosshair |
| Screener viz | ✅ `HorizontalBarChart` in `ScreenerChartPanels` |
| Pro strips | ✅ Feed, rankings, Pro feed leaders in `ChartFrame` |

---

## Phase G5 — Data & depth (only if on-brand)

- Intraday candles (Finnhub paid tier).
- Volume histogram under price.
- Minimal overlays: SMA(20), VWAP — **max 2**, Pro-only if gated.

**Not recommended:** Recharts on workspace, Chart.js, TradingView embedded widget (licensing).

---

## API / data contracts

`src/lib/charts/types.ts`:

```ts
export type CandleSeries = CandlePoint[];
export type LinePoint = { time: number; value: number };
export type ChartMarker = { time: number; price: number; label: string; color?: string };
export type PriceLine = { price: number; label: string; color?: string; style?: "solid" | "dashed" };
```

Reuse across ticker, compare, and sparklines.

---

## Files to touch (by phase)

| Phase | Primary paths |
|-------|----------------|
| G1 | `TickerChart.tsx`, `ticker-intel.ts`, `TickerChartSection.tsx`, `types.ts` |
| G2 | `HotTickersStrip.tsx`, `WatchlistPanel.tsx`, new `MiniSparkline.tsx` |
| G3 | `MemberReturnChart.tsx`, `desk/portfolio.ts`, desk page |
| G4 | `TickerCompareWorkspace.tsx`, screener components |

---

## Testing checklist

- [ ] Ticker: range change preserves markers in window.
- [ ] Ticker: 0 candles, crypto vs equity.
- [ ] Profile: 0 calls, 1 call, many calls.
- [ ] Compare: 2 and 3 symbols, mismatched histories.
- [ ] Mobile: chart resizes without blank canvas.
- [ ] Demo mode: fixtures render without Finnhub.

Update [VALUE-ROADMAP.md](./VALUE-ROADMAP.md) when a phase ships.
