# PortFuel — Value audit & product roadmap

Goal: **$79 Member** feels like a professional trading workspace; **$129 Pro Intelligence** feels like a research terminal add-on members would miss if they downgraded.

---

## What members pay for today (honest audit)

### Member ($79/mo) — solid core loop ✅

| Value | Status | Notes |
|-------|--------|--------|
| Curated member call feed (latest + performing) | ✅ | Search, asset filters, votes, comments |
| Submit calls (equity + vetted crypto) | ✅ | 2/week quota — shown on overview hero, feed, and `/calls/new` |
| Ticker pages: chart + call markers + community theses | ✅ | Strong differentiator vs Twitter/Discord |
| Rankings / leaderboard | ✅ | Public + member depth |
| Watchlist + symbol lookup | ✅ | Needs migration `20260524400000_user_watchlist.sql` |
| Profile + public member pages + return curve | ✅ | Social proof / track record |
| Fueled desk + model portfolio (house research) | ✅ | Live marks on open desk theses |
| 2FA, Stripe billing, legal | ✅ | Production-ready |

### Pro Intelligence ($129/mo) — thin vs price ⚠️

| Value | Status | Gap |
|-------|--------|-----|
| News + earnings + SEC on ticker | ✅ | **Only** on equity tickers; crypto is a stub panel |
| Extra analytics strips (feed, rankings, overview) | ✅ | 3–4 metric rows — easy to miss |
| 6 calls/week vs 2 | ✅ | Not shown until quota hit |
| Everything else | Same as Member | **Pro doesn’t feel like a separate product yet** |

**Verdict:** Member tier is defensible for a niche community platform. Pro needs **2–3 flagship features** that aren’t “a few more numbers,” or the upgrade path will feel like paying $50 for quota + news.

---

## What $100–300/mo platforms typically include

Reference set: **Benzinga Pro**, **TradingView Premium**, **Koyfin**, **TrendSpider**, **Unusual Whales**, **Stocktwits Plus**, **Motley Fool tiers**, **Seeking Alpha Premium**, **Tradervue**, **Hedgeye-style research memberships**.

| Category | Common in paid terminals | PortFuel today |
|----------|-------------------------|----------------|
| **Real-time / fast quotes** | Streaming, L2 (top tier) | 15m cron refresh |
| **Charts** | Multi-timeframe, indicators, layouts | Single range toolbar, candles + markers |
| **News & filings** | Filings alerts, news stream | Pro-gated panel per ticker |
| **Calendar** | Earnings, macro, IPO | Earnings list on ticker only |
| **Screeners / heatmaps** | Sector, volume, gaps | None |
| **Alerts** | Price, % move, news, earnings | None |
| **Portfolio / P&L** | Broker sync or manual positions | **Position intent** on watchlist (building → trimming → exited) + calls on record |
| **Community / ideas** | Ideas feed, sentiment | **Core strength** — calls + votes + rankings |
| **House research** | Analyst notes | **Fueled desk** — under-marketed |
| **Education / webinars** | Scheduled content | None |
| **Mobile / push** | App + notifications | Web only |
| **Export / API** | CSV, webhooks | None |
| **Trust / compliance** | Disclaimers, audit trail | Terms + not investment advice |

**PortFuel’s wedge:** Verified, attributed **member calls on a chart** with performance tracking and reputation (rankings) — not another charting clone. Double down on **conviction, track record, and intel around theses**, not competing with TradingView on indicators.

---

## Recommended tier positioning

### Member — “The workspace”
- Community feed + desk + submit calls + ticker theses + watchlist + rankings + profile track record.

### Pro Intelligence — “The research layer”
- Everything in Member, plus a **visible research stack**:
  1. **Market intel** (news, earnings, filings) — already built; make it discoverable from feed/watchlist.
  2. **Pro analytics** — expand beyond one extra MetricsStrip (win rate distribution, target progress leaders, sector breakdown).
  3. **Operational perks** — 6 calls/week, **earnings week calendar**, **watchlist alerts** (email or in-app).
  4. **Watchlist call alerts** — in-app notifications + watchlist row badges for new community calls (7d counts + unread).

---

## Build priority (ROI order)

### Now (1–2 days each) — ship on `main`
1. ✅ **Quota + tier strip** — “2/6 calls this week · Member/Pro” on overview + `/calls/new`.
2. ✅ **Hot tickers** on overview — symbols with most community activity (wired `HotTickersStrip`).
3. ✅ **Pro value card** on overview when locked — checklist of what Pro unlocks + upgrade CTA.
4. ✅ **Hype badge on feed cards** — symbols with hype ≥ 15 show on `CallCard`.
5. ✅ **Fueled desk hero** on overview — stronger CTA to desk (house IP).
6. ✅ **Fueled model portfolio** — admin-managed open theses (equity + crypto) with entry/target/stop and live return % on desk + overview.

### Next (high ROI, ~1 week)
6. ✅ **Watchlist move alerts** — % since add (`baseline_price` migration); Pro sees alert strip ±5%.
7. ✅ **Earnings calendar (Pro)** — next 14 days for watchlist equities (`/dashboard/watchlist`).
8. ✅ **Pro feed leaders** — target progress top 6 on member feed.
8. ✅ **Call performance digest** — weekly email: Fueled portfolio, your calls marked, 30d top movers.
9. ✅ **Ticker compare** — 2–3 symbols side-by-side mini charts (Pro) at `/dashboard/compare`.
10. ✅ **Expand Pro analytics** — return distribution on profile; feed target progress leaders shipped earlier.

### Shipped — house value & growth (recent)
11. ✅ **Follow members** — profile follow button, **Following** feed filter, overview panel, alerts when followed members publish.
12. ✅ **In-app notifications** — bell + `/notifications`; comments, votes, watchlist calls, desk updates, call milestones, DMs.
13. ✅ **Email digest** — weekly summary (Resend; enable when domain verified).
14. ✅ **Screener lite** — “most called this week,” “best 30d return,” export CSV (Pro) at `/dashboard/screener`.
15. ✅ **Admin time-series charts** — signups & calls/day (30d) on admin analytics tab.
16. ✅ **Fueled model portfolio** + desk notifications + watchlist bulk-add.
17. ✅ **AI thesis coach** + one-line summaries + admin desk research / headline drafts.
18. ✅ **Member onboarding** — display name (if needed) → watchlist seed → tour (`onboarding_completed_at`).
19. ✅ **Stripe proration preview** — upgrade estimate on profile before Member → Pro.
20. ✅ **Direct messages** — 1:1 inbox at `/dashboard/messages`, profile **Message** CTA.
21. ✅ **Pro intel teaser** — blurred equity research stack + headline counts on ticker for Members.

### Active polish queue (~1 week total, can split PRs)
| # | Item | Why |
|---|------|-----|
| P1 | ✅ **Hot tickers / overview wiring** | `OverviewActivityPanels` (open calls + hot tickers in workspace panels), open-call filter, mobile `DashboardQuickNav`. |
| P2 | ✅ **Messaging v2** | Read receipts, unread badges, thread polling, DM typing indicator (`dm_typing` + heartbeat poll). |
| P3 | ✅ **Launch / marketing pass** | Landing feature grid + `plans.ts` as source of truth; tier table prices from plans; join/success copy; Pro gate labels synced. |
| P4 | ✅ **Dashboard walkthrough gaps** | Feed “new since visit” banner + filter, watchlist → ticker intel cross-links, rankings trusted explainer, overview tips card, onboarding tour steps. |
| P5 | ✅ **Position intent (“what am I doing”)** | Private `position_intent` on watchlist — researching, building, active, trimming, exited, passed. Row picker + journal plan field; auto-active on call publish; journal entries for posture changes. |

### Later (platform & monetization)
- **Admin: Tweet → Fueled call (AI draft)** — paste tweet, pick ticker, edit, publish. Spec: [BACKLOG.md](./BACKLOG.md).
- Real-time quotes (paid Finnhub tier).
- Mobile PWA + push.
- **Broker read-only sync** (Plaid) — optional overlay vs position intent + calls on record.
- Group / thread messaging (only if DMs prove usage).

---

## Dashboard walkthrough — gaps to close

| Area | Feels premium? | Improvement |
|------|----------------|-------------|
| Overview | ✅ Hot tickers + open calls panels, quota, Pro card, desk promo | — |
| Feed | Strong cards | Hype badge, ✅ “new since last visit,” Pro analytics table |
| Desk | ✅ Light workspace panels + weekly note | Pinned thesis card matches member UI |
| Watchlist | ✅ Posture + alerts | Position intent picker, live % since add, Pro move alerts |
| Ticker | Best page | ✅ Pro preview blur; **graphs** — entry/target/stop lines, desk markers (see below) |
| Rankings | Clean | Member sparklines, ✅ trusted badge explainer |
| Profile | Good | Quota, tier benefits, upgrade |
| Calls/new | ✅ Market price + “Use as entry” | Thesis coach, trade setup preview |

---

## Unused code to wire (quick wins)

- ✅ `HotTickersStrip.tsx` + `YourPositionsStrip.tsx` — wired via `OverviewActivityPanels` on overview
- ✅ `DashboardQuickNav.tsx` — mobile overview shortcuts

---

## Charts & graphs — flagship initiative (ties the site together)

**Expect multiple weeks.** This is not a single PR; it is the visual spine of PortFuel. Technical direction lives in **[CHARTS.md](./CHARTS.md)** — one stack (`lightweight-charts` + shared `ChartFrame` / theme), no library sprawl.

**Why it matters:** Members already trust **calls on a chart**. The gap is the same chart language everywhere else — overview, desk, feed, rankings, profile, compare — so the product feels like one terminal, not separate pages.

### What exists today ✅

| Surface | Chart type | Location |
|---------|------------|----------|
| Ticker | Candles + call markers + range toolbar | `TickerChartSection` |
| Profile / member | Cumulative return line | `MemberReturnChart` |
| Overview | Performance sparkline | `OverviewPerformanceChart` |
| Pro compare | Normalized multi-symbol lines | `TickerCompareWorkspace` |
| Pro profile | Return distribution | `MemberReturnDistribution` |
| Admin | Daily signups / calls | `AdminDailyChart` |

### Graph system — phased plan

| Phase | Focus | Surfaces | Est. effort |
|-------|--------|----------|-------------|
| **G1 — Ticker truth** | Entry / target / stop price lines per call; Fueled desk marker style; crosshair + legend polish; marker click → thesis | Ticker | 1–2 weeks |
| **G2 — Workspace rhythm** | Shared mini-chart component; hot tickers + watchlist rows with 30d sparkline; feed card optional sparkline; rankings row bars | Overview, feed, watchlist, rankings | 1–2 weeks |
| **G3 — Track record story** | Profile: drawdown shading, win/loss markers on cumulative line; “your call” highlight on ticker from profile; desk model portfolio **aggregate** equity curve | Profile, desk, ticker | 2 weeks |
| **G4 — Pro terminal** | Compare: sync crosshair, shared range; screener heatmap or bar grid; sector / hype visualization (CSS-first) | Compare, screener, Pro strips | 2–3 weeks |
| **G5 — Data & depth** | Intraday (if Finnhub tier allows); volume histogram; 2–3 indicators max (SMA, VWAP) — only if still on-brand | Ticker, compare | 3+ weeks |

### Graph principles (product, not TradingView clone)

1. **Calls are the hero** — markers, levels, and return % matter more than 50 indicators.
2. **Same colors everywhere** — long/short, Fueled desk, win/loss from `src/lib/charts/theme.ts`.
3. **Server data, client draw** — keep Finnhub + Supabase fetch on server; charts stay client-only.
4. **Cap points** — 500 candles max on ticker; downsample overview sparklines.
5. **Pro differentiation** — advanced compare + distribution + future heatmaps; Member gets full ticker + profile curves.

### Suggested branch order when starting graphs

```
feature/charts-g1-ticker-levels
feature/charts-g2-workspace-sparklines
feature/charts-g3-profile-desk-curves
feature/charts-g4-pro-compare-sync
```

### Success metrics (graphs)

- Ticker page time-on-page and return visits
- % members who change chart range (engagement signal)
- Profile → ticker clicks from return chart
- Pro upgrade attributed to compare / analytics (survey or CTA clicks)

---

## Messaging for sales page

**Member:** “Publish theses, track performance on charts, and compete on the leaderboard.”

**Pro:** “Research stack on every ticker, deeper analytics, 3× call quota, and alerts on what the community is moving.”

**Charts (when marketed):** “One visual language from ticker to profile to desk — every call plotted on price, every track record on a curve.”

Avoid claiming real-time data or personalized advice. Emphasize **community intelligence + structure**.

---

## Success metrics

- Trial → paid conversion on `/join`
- Member → Pro upgrade rate (profile CTA + gates)
- Weekly active submitters / quota utilization
- Ticker page views per member per week
- Churn after month 1 (Stripe + cancelled count in admin)

Update this doc when shipping items from the priority list.
