# Stripe billing setup (PortFuel)

## 1. Stripe Dashboard

1. Create products in [Stripe Dashboard → Products](https://dashboard.stripe.com/products):
   - **Member** — recurring monthly (display $49/mo) and optional **yearly** price (e.g. $490/yr)
   - **Pro Intelligence** — recurring monthly (display $79/mo) and optional **yearly** (e.g. $790/yr)
2. Copy each **Price ID** (`price_...`).

## 2. Environment variables

Add to `.env.local` and **Vercel → Project → Settings → Environment Variables**:

```env
STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MEMBER=price_...
STRIPE_PRICE_PRO=price_...
# Optional — enables Monthly / Annual toggle on /join and profile checkout
STRIPE_PRICE_MEMBER_ANNUAL=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
NEXT_PUBLIC_APP_URL=https://www.portfuel.pro
```

Annual display copy on `/join` lives in `src/lib/marketing/plans.ts` (`ANNUAL_PLAN_BY_TIER`) — keep amounts aligned with your Stripe yearly prices.

Optional (not required for Checkout redirect flow):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

## 3. Webhook endpoint

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://www.portfuel.pro/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

For local testing use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET` locally.

## 4. Supabase migration

Run in Supabase SQL editor (or `supabase db push`):

`supabase/migrations/20260524500000_stripe_billing.sql`

Adds `membership_tier`, `stripe_customer_id`, `stripe_subscription_id` on `users`.

## 5. Customer flow

1. `/join` → pick **Member** or **Pro Intelligence**
2. Create account (username, password, display name)
3. Redirect to **Stripe Checkout**
4. Success → `/join/success` activates membership + signs user in
5. **2FA setup** → workspace

Pending users (logged in): `/join?pending=1` or **Settings** → **Complete checkout**.

Active subscribers: **Settings** → **Manage billing** (Stripe Customer Portal).

**Member → Pro upgrade:** Active Member plans use **Upgrade to Pro** on Settings. The UI loads a Stripe **invoice preview** (`GET /api/stripe/upgrade-preview`) showing estimated proration before confirm (`POST /api/stripe/upgrade` with matching `prorationDate`). Webhook `customer.subscription.updated` keeps Supabase in sync if the client path races.

**Session sync:** After portal or webhook changes, JWT billing fields refresh from Supabase on each request (middleware + `getSession`). Returning from portal lands on `/settings?billing=return` to refresh the page.

## 6. Tiers & Pro gates

| Tier | Monthly price ID | Annual price ID (optional) | Pro intelligence |
|------|------------------|----------------------------|------------------|
| Member | `STRIPE_PRICE_MEMBER` | `STRIPE_PRICE_MEMBER_ANNUAL` | Locked |
| Pro | `STRIPE_PRICE_PRO` | `STRIPE_PRICE_PRO_ANNUAL` | Unlocked |

`users.billing_interval` stores `monthly` or `annual` after checkout. Member → Pro upgrades use the **same interval** (annual Member upgrades to annual Pro).

Admins and `NEXT_PUBLIC_DEMO_MODE=true` bypass billing gates as before.

## 7. Production launch checklist

After env vars are on Vercel and `main` is deployed:

1. **Supabase** — Run `supabase/migrations/20260524500000_stripe_billing.sql` in the SQL editor if not already applied.
2. **Redeploy** — Vercel → Deployments → Redeploy latest `main` so new env vars are picked up.
3. **Webhook** — Stripe Dashboard → Webhooks → endpoint `https://www.portfuel.pro/api/stripe/webhook` → send test event `checkout.session.completed` (expect `200`).
4. **Smoke test** — Use a real test card in Stripe **test mode** first, then switch to live keys when ready.

Quick checks:

- `GET https://www.portfuel.pro/api/stripe/status` → `{ "configured": true }`
- `/join` shows plan picker (not “billing not configured”)
- After checkout, `/join/success` → 2FA → dashboard

## 8. Testing checklist

- [ ] Register + Member checkout → active + `membership_tier = member`
- [ ] Register + Pro checkout → active + `membership_tier = pro` + intel unlocked
- [ ] Webhook fires (check Stripe CLI or Dashboard logs)
- [ ] Cancel subscription → `subscription_status = cancelled`
- [ ] Billing portal opens from profile
- [ ] Terms + Privacy accepted at registration
