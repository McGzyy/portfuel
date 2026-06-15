# Get PortFuel LIVE (5 steps)

## Step 1 — Supabase (database)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project.
2. Apply **all** migrations in order:
   ```bash
   npm run migrations:list
   ```
   Use **Supabase CLI** (`supabase db push`) or paste each file from `supabase/migrations/` into the **SQL Editor** (oldest timestamp first).
3. Confirm recent billing + feature migrations are applied:
   - `20260524500000_stripe_billing.sql`
   - `20260603110000_billing_interval.sql`
   - `20260604130000_last_active_at.sql`
   - `20260604133000_ai_draft_requests.sql`

## Step 2 — Vercel (hosting)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Sign in with **GitHub**.
3. Click **Import** next to **McGzyy/portfuel**.
4. **Before Deploy** → open **Environment Variables**.

## Step 3 — Paste these variables in Vercel

Copy each line from your `.env.local` file in the project folder.

Run locally first:

```bash
npm run verify:launch
```

This checks core env, Stripe price IDs (live API), and lists critical migrations.

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Must be `https://fevfzneixflnxxuhwvut.supabase.co` (NOT your-project) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API (secret) |
| `SESSION_SECRET` | From `.env.local` |
| `TOTP_ENCRYPTION_KEY` | From `.env.local` |
| `FINNHUB_API_KEY` | From `.env.local` |
| `CRON_SECRET` | From `.env.local` |
| `STRIPE_SECRET_KEY` | From Stripe (see `docs/STRIPE.md`) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook |
| `STRIPE_PRICE_MEMBER` | Stripe Price ID — **$49/mo** |
| `STRIPE_PRICE_PRO` | Stripe Price ID — **$79/mo** |
| `STRIPE_PRICE_MEMBER_ANNUAL` | Optional — **$490/yr** |
| `STRIPE_PRICE_PRO_ANNUAL` | Optional — **$790/yr** |
| `NEXT_PUBLIC_ANNUAL_BILLING_ENABLED` | `true` when annual prices set |
| `OPENAI_API_KEY` | For AI coach, assist, summaries |
| `NEXT_PUBLIC_APP_URL` | Leave blank for first deploy, then set to your Vercel URL and redeploy |

Apply to **Production**, **Preview**, and **Development**.

## Step 4 — Deploy

Click **Deploy**. Wait until it says **Ready**.

Click **Visit**. That URL is your live site.

## Step 5 — Fix the app URL

1. Copy your live URL (example: `https://portfuel-xxxx.vercel.app`).
2. Vercel → Project → **Settings** → **Environment Variables**.
3. Set `NEXT_PUBLIC_APP_URL` to that URL (no trailing slash).
4. **Deployments** → ⋮ on latest → **Redeploy**.

## PortFuel.pro (later)

Vercel → **Settings** → **Domains** → add `portfuel.pro` → follow DNS instructions at your registrar.

## Admin login + authenticator

Your admin signs in with a **5-digit PortFuel ID (PIN)** plus a **6-digit TOTP code** from Google Authenticator, Authy, or 1Password — same as any member.

### First-time setup (recommended)

1. In `.env.local`, set:
   - `ADMIN_PIN=21296` (or any 5 digits you want)
   - `ADMIN_TOTP_SECRET=` leave blank the first time
2. Run: `node --env-file=.env.local scripts/seed.mjs`
3. The script prints a **TOTP secret** (e.g. `ZPQEZYLF...`). In your authenticator app:
   - **Add account** → **Enter setup key**
   - Account name: `PortFuel` or your PIN
   - Key: paste the secret
   - Type: Time-based (TOTP), 6 digits
4. Sign in at `/login` with your PIN + the current 6-digit code.

### If you already ran seed (admin exists)

- Use the secret printed when you first ran seed, **or**
- Delete the admin row in Supabase → **Table Editor** → `users` (PIN `21296`), then re-run seed with a new `ADMIN_TOTP_SECRET` set in `.env.local` before running.

### Optional: fix the secret in `.env.local`

After seed prints a secret, you can save it:

```
ADMIN_TOTP_SECRET=YOUR_SECRET_HERE
```

Re-running seed will **not** overwrite an existing admin — delete the row first if you need to reset.

## Still broken?

Send a screenshot of the **red error** in Vercel → Deployments → failed build **or** the browser error page.
