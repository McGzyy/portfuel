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
| Ticker page + chart | ✅ | Basic thesis list |
| Onboarding (display name) | ✅ | Minimal UI |
| Cron: refresh quotes | ✅ | Every 15 min |
| Votes & comments (API + UI) | ❌ | DB tables exist, no routes/UI yet |
| Rankings / leaderboard | ❌ | `rank_score` in DB, no page yet |
| Profile page | ❌ | Middleware references `/profile`, page missing |

### Phase 2 — Market intel (partial)

| Item | Status | Notes |
|------|--------|--------|
| Stock intel panel (news, earnings, SEC) | ✅ | On ticker page |
| Crypto allowlist + cron | ✅ | Run migration + cron once if not done |
| Memecoin blocklist | ✅ | On submit validation |

### Phase 3 — Business (later)

- Stripe checkout + subscription webhooks
- Real Terms / Privacy copy
- Admin tools

---

## Build order (do not skip ahead)

Work through these **one branch at a time**. Finish and merge before starting the next.

### 1. `feature/phase-1-app-shell` ← **in progress / ready for PR**

**Goal:** Authenticated app feels as polished as landing/login.

- [x] `AppShell`, `PageHeader`, `TabNav` layout components
- [x] Dashboard: pill tabs, empty state, design-system buttons
- [x] `/calls/new`: segmented controls, form sections, symbol validation UX
- [x] `/onboarding`: `AuthShell` + labels
- [x] `CallCard` hover, footer divider, spacing

**Done when:** A member can log in → dashboard → submit call → see it on dashboard without UI feeling “MVP rough.”

### 2. `feature/phase-1-votes-comments`

**Goal:** Social layer on calls.

- API: vote (up/down), list/create comments
- UI on `CallCard` or call detail drawer
- RLS policies tested with service role + session user

**Done when:** Logged-in user can vote and comment on a call; counts update on dashboard.

### 3. `feature/phase-1-rankings`

**Goal:** Leaderboard from `users.rank_score`.

- `/rankings` page (public or members-only — decide in PR)
- Link from header when logged in

**Done when:** Top callers visible with display name + win rate / score.

### 4. `feature/phase-1-profile`

**Goal:** `/profile` route middleware already expects.

- View/edit display name
- Show own stats + recent calls

### 5. `feature/phase-2-ticker-polish`

**Goal:** Ticker page is the “pro” view.

- Intel panel layout, loading states, crypto vs equity modes
- Chart markers for calls (if not already solid)

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

- [ ] Both migrations applied in SQL Editor
- [ ] Admin seeded (`scripts/seed.mjs` or `scripts/reset-admin-totp.mjs`)
- [ ] Crypto allowlist cron triggered once (production)
- [ ] Vercel env vars match `.env.local` (no placeholders)

## Commit message examples

```
Polish dashboard to use shared AppShell and design tokens.

Add POST /api/calls/[id]/vote and wire thumbs on CallCard.

Add /rankings page sorted by rank_score.
```
