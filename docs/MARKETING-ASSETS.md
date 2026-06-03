# Marketing assets & paid acquisition

Companion to [MARKETING-PLAN.md](./MARKETING-PLAN.md). Use these URLs, sizes, and UTMs so ads and organic posts match what PortFuel already generates.

## Primary creative sizes

| Use | Size | Source in product |
|-----|------|-------------------|
| Homepage / join link preview | 1200×630 | Auto: `/opengraph-image` · `/join/opengraph-image` · API: `/api/og/marketing?variant=join` |
| X / LinkedIn link preview | 1200×675 | `/api/social/chart/{callId}?format=png` · weekly: `/api/admin/social/weekly-digest/chart` (admin) |
| Meta / display | 1200×628 (crop from 675) | Export PNG from chart URL, slight top/bottom crop |
| Square retargeting | 1080×1080 | Crop chart or use product hero from `/` |

Always use **dark PortFuel charts** for performance posts — they match the live brand on X.

## UTM convention (required on paid links)

| Channel | `utm_source` | `utm_medium` | `utm_campaign` example |
|---------|--------------|--------------|----------------------|
| X organic automation | `x` | `social` | `member_win`, `weekly_digest`, `leaderboard` |
| X paid | `x` | `paid` | `founding_q2`, `chart_nvda_win` |
| Meta paid | `facebook` | `paid` | `prospecting_traders` |
| Google search | `google` | `cpc` | `brand`, `stock_call_tracker` |
| Referral member | `referral` | `member` | `{username}` |

Landing paths:

- **Cold / broad:** `https://portfuel.pro/` (homepage shows proven winners only)
- **Warm / chart post:** `https://portfuel.pro/ticker/{SYMBOL}?utm_*`
- **Signup:** `https://portfuel.pro/join?utm_*`

## Recommended ad angles (aligned with product)

1. **Proof** — Screenshot or PNG of a member spotlight or weekly digest composite. Headline: “Calls on record. Returns tracked.” CTA: Join PortFuel.
2. **Structure** — Product UI: ticker chart with entry, target, community markers. Headline: “Publish your thesis. Build a track record.”
3. **Desk + community** — Split: Fueled desk lane vs member rankings. Headline: “House research and member intelligence in one workspace.”

Do not promise early tips, guaranteed returns, or “before the move” access — paid members get timing; public content shows **outcomes after gates**.

## Copy blocks (paste-ready)

**Short headline options**

- Track your market calls like a professional desk
- Community intelligence with verified performance
- Publish calls. Prove results on PortFuel.

**Primary text (Meta / long X)**

PortFuel is a members-only workspace for attributed stock and crypto calls: entry, target, stop, live return, and reputation on the leaderboard. Public highlights only feature calls that meet strict performance standards — not fresh entries.

**CTA**

- Join PortFuel
- See the track record

## Testing checklist before spend

- [ ] Landing loads with real teaser calls (not empty preview mode in prod)
- [ ] `/join` Stripe and copy match ad promise (Member vs Pro)
- [ ] Chart PNG matches symbol in ad (no wrong ticker)
- [ ] UTM appears in analytics (Vercel / Plausible / GA)
- [ ] Disclaimer visible on X posts: “Not investment advice.”

## Organic ↔ paid reuse

| Asset | Organic | Paid |
|-------|---------|------|
| Member spotlight chart | Auto after gates + opt-in | Best-performing post → dark post boost |
| Weekly digest composite | Monday cron | Carousel ad, single image |
| Rankings snippet | Weekly cron | Retarget site visitors |

## Admin workflow

1. **Activity & queue** — Admin → Social → see published log vs ready pipeline  
2. **Dry run** — Every post type before enabling cron flags  
3. **Copy** — Admin → Social → X post copy templates  
4. **Enable automation** — `X_POST_MEMBER_WINS`, `X_POST_WEEKLY_DIGEST`, etc. on Vercel only after review  

## Related docs

- [X-SOCIAL.md](./X-SOCIAL.md) — env vars and cron  
- [LAUNCH-PLAYBOOK.md](./LAUNCH-PLAYBOOK.md) — founding member rhythm  
