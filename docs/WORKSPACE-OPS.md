# Workspace ops checklist

Use this after deploys or when validating Pro / feed behavior in production.

## Database

- [ ] Apply pending Supabase migrations: `supabase db push` (or run new files in the SQL editor).
- [ ] Confirm `calls` rows have `entry_price` populated for new publishes (falls back to `price_at_call` when entry omitted).

## Vercel environment

- [ ] `SESSION_SECRET`, Supabase URL + service role, Stripe keys.
- [ ] `CRON_SECRET` — required for `/api/cron/refresh-quotes` (every 15 minutes per `vercel.json`).
- [ ] Finnhub / market data keys for quotes.
- [ ] Referral + X automation (if enabled): referral Stripe code, `X_POST_MEMBER_WIN_STILL_RUNNING`, social copy env vars from marketing docs.

## Quote refresh smoke test

1. Open **Member feed** → **Update prices** — returns should move off stale `0.00%` when markets move.
2. Open a **ticker** with open calls — Entry / Last on cards and community bar.
3. Optional: `GET /api/cron/refresh-quotes` with `Authorization: Bearer $CRON_SECRET` and confirm `updated` > 0.

## Workspace UX smoke test

1. **Overview** — quick actions one horizontal row; open calls show price line when set.
2. **Feed** — Fueled desk strip shows Entry / Target / Stop / Last; **Fueled** filter lists desk calls.
3. **Publish** — after submit, green banner on ticker; checklist updates.
4. **Ticker (free)** — Pro Intelligence strip with Compare / Screener links.
5. First visit — **Workspace map** modal once (sidebar **Help** reopens it).
6. **Public profile** (`/member/{username}`) — share track record PNG when you have calls; **Settings** (`/settings`) for billing and referrals.
7. **Screener (Pro)** — Activity / Target progress / Desk vs crowd / Conviction tabs.
8. **Earnings (Pro)** — how-it-works explainer; reporting symbols with community lean + desk direction.
9. **Legacy `/profile`** — redirects to your public member page.

## Admin & referrals

- [ ] **Admin → Members** — roster strip on one row; directory panel header.
- [ ] **Admin → Vouchers** — inventory strip; create/assign panels use `pf-workspace-panel`.
- [ ] **Admin → Social** — X status strip on one row; queue snapshot before publish tabs.
- [ ] **Settings → Sharing** — referral stats on one row; Discord shows linked tier inline.
- [ ] **Mobile nav** — notifications bell shows unread badge; sidebar includes Notifications link.

## Marketing (process)

- Paid ads and compliance steps live in `MARKETING-PLAN.md` — not automated in app code.
