# Desk Discovery Radar

Automated **lite** market scanning → admin **Discovery** inbox → manual Fueled publish. Nothing auto-posts.

## Lite tier (active)

| Signal | Source | Notes |
|--------|--------|-------|
| Earnings soon | Finnhub calendar | 2–14 days out, static equity universe |
| News catalyst | Finnhub market news | Keyword + symbol tag filter |
| Volume / price | Twelve Data daily OHLCV | Rotating ~35 symbols per scan |
| Crypto momentum | Finnhub / Twelve Data | Core majors vs BTC 7d |

**Gates:** no recent Fueled call (90d), snooze/reject cooldown, parabolic filter, min score 25.

**Ops:** Admin → Discovery → Run scan, or cron `0 13,21 * * 1-5` (weekdays).

**Migration:** `20260711100000_desk_signal_candidates.sql`

## Paid roadmap (future)

### Phase 2 — Broad screeners (~$22–79/mo)

- **FMP screener** — liquid names outside static universe, fundamental filters
- **Polygon / Massive** — gaps, unusual volume, extended hours

Env stubs: `FMP_API_KEY`, `POLYGON_API_KEY` → `src/lib/desk-discovery/providers/`

### Phase 3 — Options flow (~$150+/mo)

- **Unusual Whales / flow API** — unusual activity before social

Env stub: `UNUSUAL_WHALES_API_KEY`

Paid providers plug into the same inbox and review flow; enable keys when ROI justifies cost.
