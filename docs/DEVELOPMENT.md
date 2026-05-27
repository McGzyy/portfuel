# PortFuel development guide

How we build PortFuel **in order**, with clean git history and deployable `main`.

## Branch model

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready. Always matches what Vercel deploys. **No direct feature work here.** |
| `feature/<phase>-<short-name>` | One focused slice of work. Merge to `main` via PR when done. |

**Rules**

1. Start every task from up-to-date `main`: `git checkout main && git pull`
2. Create a branch: `git checkout -b feature/phase-1-app-shell`
3. Commit often with clear messages (present tense, what + why).
4. Open a PR on GitHub → review → merge → delete branch.
5. Vercel auto-deploys `main` after merge.

We do **not** jump between unrelated features on the same branch.

## Naming branches

```
feature/phase-1-app-shell
feature/phase-1-votes-comments
feature/phase-2-ticker-intel
feature/phase-3-stripe-billing
```

## Solo launch / empty feed

See **[LAUNCH-PLAYBOOK.md](./LAUNCH-PLAYBOOK.md)** — Fueled desk rhythm, preview mode, founding members. Admin UI: `/admin?tab=launch`.

Deferred ideas: **[BACKLOG.md](./BACKLOG.md)** (e.g. tweet → Fueled AI draft, X auto-posting).

## What’s done (on `main`)

### Phase 0 — Foundation ✅

- Next.js app, Supabase schema, auth (PIN + TOTP), Finnhub quotes/candles
- Vercel deploy, custom domain, env + cron
- Design system (`globals.css`), pinpad login, landing + join polish

### Phase 1 — Core member loop (partial)

| Item | Status | Notes |
|------|--------|--------|
| Register / login / session | ✅ | Pinpad + OTP |
| Landing teasers | ✅ | Empty until calls exist |
| Dashboard (latest / performing) | ✅ | UI not fully aligned with new design system |
| Submit call (`/calls/new`) | ✅ | Equity + crypto validation |
| Ticker page + chart | ✅ | lightweight-charts; see [CHARTS.md](./CHARTS.md) for roadmap |
| Onboarding (display name) | ✅ | Minimal UI |
| Cron: refresh quotes | ✅ | Every 15 min |
| Votes & comments (API + UI) | ✅ | Dashboard + ticker theses |
| Public landing teasers | ✅ | Winners only; thesis gated |
| Rankings / leaderboard | ✅ | `/rankings` + cron score refresh |
| Profile page | ✅ | Username (read-only), stats, recent calls |
| Username + password auth | ✅ | Immutable username; 2FA after activation |
| Admin panel | ✅ | `/admin` — activate members, quotas |

### Phase 2 — Market intel (partial)

| Item | Status | Notes |
|------|--------|--------|
| Stock intel panel (news, earnings, SEC) | ✅ | On ticker page |
| Crypto allowlist + cron | ✅ | Run migration + cron once if not done |
| Memecoin blocklist | ✅ | On submit validation |

### Phase 3 — Business (in progress)

| Item | Status | Notes |
|------|--------|--------|
| Stripe Checkout + webhooks | ✅ | See [STRIPE.md](./STRIPE.md) |
| Member vs Pro tier + Pro gates | ✅ | `membership_tier` on users |
| Stripe Customer Portal | ✅ | Profile → Manage billing |
| Real Terms / Privacy copy | ✅ | `/terms`, `/privacy`; required on `/join` |
| Value audit & feature roadmap | ✅ | See [VALUE-ROADMAP.md](./VALUE-ROADMAP.md) |
| Charts / graphs initiative (phased) | 📋 | See [CHARTS.md](./CHARTS.md) — **G1 ticker levels** is the recommended start |

---

## Build order (do not skip ahead)

Work through these **one branch at a time**. Finish and merge before starting the next.

### 1. `feature/phase-1-app-shell` ← **in progress / ready for PR**

**Goal:** Authenticated app feels as polished as landing/login.

- [x] `AppShell`, `PageHeader`, `TabNav` layout components
- [x] Dashboard: pill tabs, empty state, design-system buttons
- [x] `/calls/new`: segmented controls, form sections, symbol validation UX
- [x] `/onboarding`: 3-step wizard (display name if needed → watchlist seed → tour)
- [x] `CallCard` hover, footer divider, spacing

**Done when:** A member can log in → dashboard → submit call → see it on dashboard without UI feeling “MVP rough.”

### 2. `feature/phase-1-votes-comments` ← **in progress / ready for PR**

**Goal:** Social layer on calls.

- [x] API: `POST/GET /api/calls/[id]/vote`, `GET/POST /api/calls/[id]/comments`
- [x] `CallEngagement` on dashboard cards and ticker theses (logged-in only)
- [x] Vote score recomputed on `calls.vote_score`; comment count incremented

**Done when:** Logged-in user can vote and comment on a call; counts update on dashboard.

### 2b. `feature/phase-1-visual-polish` ← **in progress / ready for PR**

**Goal:** Homepage and existing pages feel premium, not MVP-flat.

- [x] Hero with product mock, stats strip, how-it-works, CTA band, dark footer
- [x] App shell background, call card accents, join/login polish
- [x] Ticker + dashboard + legal pages aligned with design system

**Done when:** Public site and member pages look intentionally designed end-to-end.

### 3. `feature/phase-1-rankings` ← **ready for PR**

**Goal:** Leaderboard + gate public homepage.

- [x] Public homepage: no live feed; only calls ≥5% (30d) and ≥10% (7d+ mature)
- [x] `PublicHighlightCard` blurs thesis; `MembersFeedGate` section
- [x] `/rankings` leaderboard; scores refresh on quote cron
- [x] Migration `20260524200000_public_teaser_gates.sql`

**Done when:** Visitors see winners only; members get full feed after login.

### 4. `feature/phase-1-profile-auth` ← **ready for PR**

**Goal:** Member identity, admin controls, modern auth.

- [x] `/profile` — username, stats, recent calls
- [x] Login: username + password; TOTP when enabled
- [x] Signup: username (immutable) + password; `pending` until activated
- [x] `/security/2fa` — required for active members before dashboard
- [x] `/admin` — activate membership, adjust weekly quota
- [x] Header shows **Administrator** badge (not numeric ID)
- [x] Migration `20260524300000_username_password_auth.sql`

**Ops after merge:** Run migration in Supabase; set admin password:
`node --env-file=.env.local scripts/set-admin-password.mjs`

### 5. `feature/phase-2-ticker-polish` ← **done**

**Goal:** Ticker page is the “pro” view.

- [x] Ticker `loading.tsx` skeleton
- [x] Intel panel layout (equity stack vs crypto card)
- [x] Chart marker legend
- [x] Site copy: “Join the action” CTAs (member intel, not squad/team)
- [x] Dashboard pro pass: feed pulse, price metrics on cards, quick nav, member snapshot tiles

### 5d. `feature/phase-2-market-tools` ← **done**

### 5e. `feature/phase-2-dashboard-watchlist-admin` ← **done**

### 5f. `feature/phase-2-elite-polish` ← **done**

### 5g. Dashboard workspace IA

- `/dashboard` — Overview (KPIs, shortcuts, previews)
- `/dashboard/feed` — Member feed (search, filters, full grid)
- `/dashboard/desk` — Fueled desk only
- `/dashboard/watchlist` — Watchlist + ticker lookup
- Shared `MemberNav` sub-navigation under header

- [x] Public member profiles `/member/[username]` (elite hero, track record)
- [x] Dashboard: Fueled desk strip, your book strip, feed search
- [x] Caller links on cards, rankings, profile unification
- [x] Elite panels (dark Fueled desk, member hero)

- [x] Replace misleading “Ticker intel / Crypto desk” links with **Look up ticker** (any symbol)
- [x] Dashboard layout: feed + sidebar watchlist
- [x] Feed filters: All · Fueled · Stocks · Crypto
- [x] Watchlist API + migration `20260524400000_user_watchlist.sql`
- [x] Admin **Analytics** tab (members, calls, engagement, top symbols)
- [ ] Stripe / payments — explicitly deferred

**Ops:** Run watchlist migration in Supabase after merge.

- [x] Ticker community stats bar (calls, long/short, avg/best return)
- [x] Rankings summary bar + `@username` column
- [x] New call: trade setup preview (upside, risk, R:R) + `?symbol=` prefill from ticker
- [x] Dashboard hot tickers strip from active feed
- [x] Thesis blocks: full price metrics on ticker page

### Demo preview data (`NEXT_PUBLIC_DEMO_MODE=true`)

Fills feeds with **15 sample calls** (member + **Fueled** / PortFuel bot), leaderboard, public teasers, ticker theses, comments, and votes. No DB writes for `demo-call-*` IDs. Amber banner shows when active.

**Local**

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Restart `npm run dev` after toggling.

**Production (portfuel.pro)**

1. Merge `feature/demo-preview-data` into `main` and push (Vercel only deploys `main`).
2. Vercel → Project → **Settings** → **Environment Variables** → add `NEXT_PUBLIC_DEMO_MODE` = `true` for **Production** (and Preview if you want it on preview URLs).
3. **Deployments** → ⋮ on latest → **Redeploy** (env vars are baked in at build time).

You should see an amber **Demo preview** banner and ~15 calls on the dashboard. Set `false` (or remove the var) before real launch.

### 6. `feature/phase-3-stripe`

**Goal:** Paid membership replaces “pending” beta message.

- Checkout, webhooks, `subscription_status` updates
- Gate dashboard until `active` (except admin)

---

## Daily workflow (copy-paste)

```bash
# Start of task
git checkout main
git pull origin main
git checkout -b feature/phase-1-app-shell

# Work, commit
git add -A
git commit -m "Polish dashboard tabs and empty state"

# Push and open PR
git push -u origin feature/phase-1-app-shell
# GitHub → New Pull Request → merge when CI green
```

## Supabase / ops checklist (once per environment)

- [ ] All migrations applied in SQL Editor (including `20260524300000_username_password_auth.sql`, `20260524400000_user_watchlist.sql`, `20260524500000_stripe_billing.sql`, `20260524600000_watchlist_baseline.sql`, `20260524700000_user_notifications.sql`, `20260524800000_user_email_notifications.sql`, `20260524900000_user_follows.sql`, `20260525000000_desk_brief.sql`, `20260525100000_desk_portfolio.sql`, `20260525200000_desk_portfolio_notifications.sql`, `20260525300000_ai_coach_usage.sql`, `20260525400000_call_thesis_summaries.sql`, `20260525500000_call_milestones.sql`, `20260525600000_user_onboarding.sql`, `20260525700000_direct_messages.sql`, `20260525800000_dm_typing.sql`)
- [ ] Resend: `RESEND_API_KEY`, `EMAIL_FROM` — see [EMAIL.md](./EMAIL.md)
- [ ] AI coach: `OPENAI_API_KEY` + migration `20260525300000_ai_coach_usage.sql` — see [AI.md](./AI.md)
- [ ] Admin password set (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `scripts/set-admin-password.mjs`)
- [ ] Admin seeded (`scripts/seed.mjs` or `scripts/reset-admin-totp.mjs`)
- [ ] Crypto allowlist cron triggered once (production)
- [ ] Vercel env vars match `.env.local` (no placeholders)

## Commit message examples

```
Polish dashboard to use shared AppShell and design tokens.

Add POST /api/calls/[id]/vote and wire thumbs on CallCard.

Add /rankings page sorted by rank_score.
```
