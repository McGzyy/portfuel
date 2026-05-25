# Charts roadmap (PortFuel)

Charts are a core part of the paid product. **Do not add one-off chart libraries per page** — extend the shared stack below.

## Current stack

| Layer | Choice | Where |
|-------|--------|--------|
| Price (OHLC) | [lightweight-charts](https://tradingview.github.io/lightweight-charts/) v5 | `src/components/charts/TickerChart.tsx` |
| Data | Finnhub candles + call markers | `src/lib/market/ticker-intel.ts` |
| Client boundary | `TickerChartClient` (dynamic, no SSR) | `src/components/charts/TickerChartClient.tsx` |

Ticker pages already render candlesticks + member call markers. Styling lives in `pf-ticker-chart-frame` (`globals.css`).

## Principles (before building more charts)

1. **Server fetches, client renders** — candles/quotes/aggregates from API routes or server components; chart components stay `"use client"`.
2. **Shared theme** — one `chartTheme.ts` for colors, grid, fonts (match `--pf-black`, `--pf-red`, gray scale).
3. **Shared container** — use `pf-ticker-chart-frame` or a new `ChartFrame` wrapper (title, legend, loading, empty).
4. **Resize-safe** — `ResizeObserver` on container (already pattern in `TickerChart`).
5. **Performance** — cap points (e.g. 500 candles), downsample for overview sparklines.

## Planned chart surfaces (priority)

| Surface | Type | Library | Notes |
|---------|------|---------|--------|
| Ticker page | Candlestick + markers | lightweight-charts | Polish theme, crosshair, timeframe tabs |
| Dashboard overview | Sparkline / mini equity curve | lightweight-charts or SVG | Member P&L trend |
| Member profile | Return distribution / cumulative | lightweight-charts histogram or line | From `calls.return_pct` |
| Rankings | Bar / leaderboard spark | lightweight-charts or CSS bars | Keep lightweight |
| Admin analytics | Time series (signups, calls/day) | lightweight-charts | After admin metrics API stable |
| Feed (optional) | Sector heatmap | CSS grid first, chart later | Lower priority |

## Not recommended (for now)

- **Recharts** — fine for marketing, but a second mental model vs trading charts.
- **Chart.js** — weaker financial defaults.
- **TradingView widget** — licensing/branding; keep in-house.

## Implementation order (when you pick charts up)

1. ~~Extract `src/lib/charts/theme.ts` + `ChartFrame.tsx`.~~ ✅ Done — ticker page uses these.
2. ~~Refine ticker chart (theme, toolbar, loading skeleton).~~ ✅ `TickerChartSection` + `ChartRangeToolbar`.
3. ~~Member profile cumulative return line.~~ ✅ `MemberReturnChart` on `/member` and `/profile`.
4. ~~Dashboard workspace mini-chart.~~ ✅ Overview performance sparkline.
5. Admin analytics — MetricsStrip (time-series charts later).

## API / data contracts

Define typed series in `src/lib/charts/types.ts`:

```ts
export type CandleSeries = { time: number; open: number; high: number; low: number; close: number }[];
export type LinePoint = { time: number; value: number };
export type ChartMarker = { time: number; price: number; label: string; color?: string };
```

Reuse `CandlePoint` / `ChartMarker` from `TickerChart.tsx` when extracting.

## Files to touch

- `src/components/charts/` — all chart UI
- `src/lib/market/` — market series
- `src/lib/calls/` — call-derived series (returns, progress)
- `docs/DEVELOPMENT.md` — link here from build order
