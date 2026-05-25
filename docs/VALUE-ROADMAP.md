# PortFuel — Value audit & product roadmap

Goal: **$79 Member** feels like a professional trading workspace; **$129 Pro Intelligence** feels like a research terminal add-on members would miss if they downgraded.

---

## What members pay for today (honest audit)

### Member ($79/mo) — solid core loop ✅

| Value | Status | Notes |
|-------|--------|--------|
| Curated member call feed (latest + performing) | ✅ | Search, asset filters, votes, comments |
| Submit calls (equity + vetted crypto) | ✅ | 2/week quota — **under-communicated in UI** |
| Ticker pages: chart + call markers + community theses | ✅ | Strong differentiator vs Twitter/Discord |
| Rankings / leaderboard | ✅ | Public + member depth |
| Watchlist + symbol lookup | ✅ | Needs migration `20260524400000_user_watchlist.sql` |
| Profile + public member pages + return curve | ✅ | Social proof / track record |
| Fueled desk (house research lane) | ✅ | Premium content lane |
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
| **Portfolio / P&L** | Broker sync or manual positions | Own calls only (no portfolio) |
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
  4. **Future flagship** — alert when a watched symbol gets a new member call or hits return threshold.

---

## Build priority (ROI order)

### Now (1–2 days each) — ship on `main`
1. ✅ **Quota + tier strip** — “2/6 calls this week · Member/Pro” on overview + `/calls/new`.
2. ✅ **Hot tickers** on overview — symbols with most community activity (wired `HotTickersStrip`).
3. ✅ **Pro value card** on overview when locked — checklist of what Pro unlocks + upgrade CTA.
4. ✅ **Hype badge on feed cards** — symbols with hype ≥ 15 show on `CallCard`.
5. **Fueled desk hero** on overview — stronger CTA to desk (house IP). *(still open)*

### Next (high ROI, ~1 week)
6. ✅ **Watchlist move alerts** — % since add (`baseline_price` migration); Pro sees alert strip ±5%.
7. ✅ **Earnings calendar (Pro)** — next 14 days for watchlist equities (`/dashboard/watchlist`).
8. ✅ **Pro feed leaders** — target progress top 6 on member feed.
8. **Call performance digest** — weekly email: your calls marked, community top movers.
9. **Ticker compare** — 2–3 symbols side-by-side mini charts (Pro).
10. **Expand Pro analytics** — distribution chart on profile; feed “top target progress” table.

### After that (differentiation)
11. ✅ **Follow members** — profile follow button, **Following** feed filter, overview panel, alerts when followed members publish.
12. ✅ **In-app notifications** — bell + `/notifications`; comments, votes, watchlist calls.
13. ✅ **Email digest** — weekly summary (Resend; enable when domain verified).
13. **Messaging** (original vision) — DMs or threaded replies.
14. **Screener lite** — “most called this week,” “best 30d return,” export CSV (Pro).
15. **Admin time-series charts** — signups, MRR proxy, calls/day (`docs/CHARTS.md` step 5).

### Later (premium polish)
16. Real-time quotes (paid Finnhub tier).
17. Mobile PWA + push.
18. Broker read-only sync (Plaid) for “your book vs calls.”
19. AI thesis summary / risk flags (careful compliance).

---

## Dashboard walkthrough — gaps to close

| Area | Feels premium? | Improvement |
|------|----------------|-------------|
| Overview | Good hero + sparkline | Add hot tickers, quota, Pro card, desk promo |
| Feed | Strong cards | Hype badge, “new since last visit,” Pro analytics table |
| Desk | Distinct dark lane | Weekly desk note / pinned thesis |
| Watchlist | Functional | Live % change column, alerts (Pro) |
| Ticker | Best page | Cross-link intel from watchlist; Pro preview blur |
| Rankings | Clean | Member sparklines, trusted badge explainer |
| Profile | Good | Quota, tier benefits, upgrade |
| Calls/new | Form OK | Quota header, symbol validation UX, preview card |

---

## Unused code to wire (quick wins)

- `HotTickersStrip.tsx` — overview
- `YourPositionsStrip.tsx` — repurpose as “Your open calls” (active calls count)
- `DashboardQuickNav.tsx` — optional mobile shortcuts

---

## Messaging for sales page

**Member:** “Publish theses, track performance on charts, and compete on the leaderboard.”

**Pro:** “Research stack on every ticker, deeper analytics, 3× call quota, and alerts on what the community is moving.”

Avoid claiming real-time data or personalized advice. Emphasize **community intelligence + structure**.

---

## Success metrics

- Trial → paid conversion on `/join`
- Member → Pro upgrade rate (profile CTA + gates)
- Weekly active submitters / quota utilization
- Ticker page views per member per week
- Churn after month 1 (Stripe + cancelled count in admin)

Update this doc when shipping items from the priority list.
