# PortFuel.pro

Professional stock call dashboard — PIN + TOTP auth, live charts, performance tracking.

## Stack

- **Next.js 16** (App Router)
- **Supabase** (Postgres)
- **Finnhub** (quotes, news) + **Twelve Data** (chart candles, free tier)
- **Vercel** (hosting + cron)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Run SQL in `supabase/migrations/20260524000001_initial.sql` (SQL Editor or CLI)
   - Copy URL, anon key, and service role key

3. **Environment**

   Copy `.env.example` to `.env.local` and fill in:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (32+ chars)
   - `TOTP_ENCRYPTION_KEY`
   - `FINNHUB_API_KEY` — free key at [finnhub.io](https://finnhub.io) (quotes/news)
   - `TWELVEDATA_API_KEY` — free key at [twelvedata.com](https://twelvedata.com) (ticker charts)
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`

4. **Seed admin (optional)**

   ```bash
   node --env-file=.env.local scripts/seed.mjs
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Deploy (Vercel)

- Import repo, set env vars, deploy
- Cron runs `/api/cron/refresh-quotes` every 15 minutes (set `CRON_SECRET`)
- Point **PortFuel.pro** DNS to Vercel

## Development workflow

See **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** for phased build order, git branches, and what to work on next.

## Phase 1 routes

| Route | Description |
|-------|-------------|
| `/` | Public landing + teaser calls |
| `/login` | PIN + authenticator |
| `/join` | Membership UI + registration |
| `/dashboard` | Latest & performing feeds |
| `/calls/new` | Submit a call |
| `/ticker/[symbol]` | Chart + theses |

## Supabase migration (public teasers)

After the first two migrations, run:

`supabase/migrations/20260524200000_public_teaser_gates.sql`

This restricts the homepage to performance winners only (no live feed for visitors).

## Phase 2 additions

- **Stocks:** News, earnings, SEC filings, company stats on `/ticker/[symbol]`
- **Crypto:** Major-exchange allowlist (Coinbase/Kraken via Finnhub), memecoin blocklist
- Run migration `supabase/migrations/20260524100000_asset_class_crypto.sql`
- After deploy, trigger once: `GET /api/cron/sync-crypto-allowlist` with `Authorization: Bearer <CRON_SECRET>`

## Admin seed

```bash
node --env-file=.env.local scripts/seed.mjs
```

If `ADMIN_TOTP_SECRET` is blank, the script prints a TOTP secret for your authenticator.
