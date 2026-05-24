# Get PortFuel LIVE (5 steps)

## Step 1 — Supabase (database)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project.
2. **SQL Editor** → New query → paste ALL of `supabase/migrations/20260524000001_initial.sql` → Run.
3. New query → paste ALL of `supabase/migrations/20260524100000_asset_class_crypto.sql` → Run.

## Step 2 — Vercel (hosting)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Sign in with **GitHub**.
3. Click **Import** next to **McGzyy/portfuel**.
4. **Before Deploy** → open **Environment Variables**.

## Step 3 — Paste these variables in Vercel

Copy each line from your `.env.local` file in the project folder.

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Must be `https://fevfzneixflnxxuhwvut.supabase.co` (NOT your-project) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API (secret) |
| `SESSION_SECRET` | From `.env.local` |
| `TOTP_ENCRYPTION_KEY` | From `.env.local` |
| `FINNHUB_API_KEY` | From `.env.local` |
| `CRON_SECRET` | From `.env.local` |
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
