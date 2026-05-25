# Stripe billing setup (PortFuel)

## 1. Stripe Dashboard

1. Create products in [Stripe Dashboard → Products](https://dashboard.stripe.com/products):
   - **Member** — recurring monthly (display $79/mo)
   - **Pro Intelligence** — recurring monthly (display $129/mo)
2. Copy each **Price ID** (`price_...`).

## 2. Environment variables

Add to `.env.local` and **Vercel → Project → Settings → Environment Variables**:

```env
STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MEMBER=price_...
STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_APP_URL=https://www.portfuel.pro
```

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

Pending users (logged in): `/join?pending=1` or profile **Complete checkout**.

Active subscribers: profile → **Manage billing** (Stripe Customer Portal).

## 6. Tiers & Pro gates

| Tier | Price ID env | Pro intelligence |
|------|----------------|------------------|
| Member | `STRIPE_PRICE_MEMBER` | Locked |
| Pro | `STRIPE_PRICE_PRO` | Unlocked |

Admins and `NEXT_PUBLIC_DEMO_MODE=true` bypass billing gates as before.

## 7. Testing checklist

- [ ] Register + Member checkout → active + `membership_tier = member`
- [ ] Register + Pro checkout → active + `membership_tier = pro` + intel unlocked
- [ ] Webhook fires (check Stripe CLI or Dashboard logs)
- [ ] Cancel subscription → `subscription_status = cancelled`
- [ ] Billing portal opens from profile
