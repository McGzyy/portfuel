# Vouchers

Admin-managed promo codes for checkout discounts and time-limited Pro intelligence upgrades.

## Apply migration

```bash
npx supabase db push
# or run supabase/migrations/20260603100000_vouchers.sql in the SQL editor
```

## Admin

**Admin → Vouchers** (`/admin?tab=vouchers`)

- **Checkout discount** — syncs a Stripe coupon + promotion code; applied at `/join` or `/api/stripe/checkout` with `voucherCode`.
- **Pro trial** — grants `users.pro_granted_until` without changing Stripe tier; redeem via `POST /api/vouchers/redeem` (logged-in members).

### Audience

| Audience | Who can use |
|----------|-------------|
| `public` | Anyone with the code |
| `assigned` | Users listed via **Assign** (user UUID) |
| `affiliate` | Checkout/signup with a referral from an affiliate granted on that voucher |

### Plan targeting

- **Plan tier** — `member`, `pro`, or `any` (checkout tier selected)
- **Billing interval** — `monthly`, `annual`, or `any` (annual prices not wired in Stripe yet; field is ready)

## APIs

| Route | Purpose |
|-------|---------|
| `GET /api/vouchers/validate?code=&tier=&kind=` | Pre-check code |
| `POST /api/vouchers/redeem` | Apply Pro trial (`{ "code": "..." }`) |
| `GET/POST /api/admin/vouchers` | List / create |
| `PATCH /api/admin/vouchers/[id]` | Deactivate, extend expiry |
| `POST /api/admin/vouchers/[id]/assign` | Assigned audience |
| `POST /api/admin/vouchers/[id]/affiliate-grants` | Affiliate audience |

## Stripe

Checkout discounts require `STRIPE_*` env vars. Creation calls Stripe to create a one-time coupon and promotion code matching the voucher `code`.

Pro trials do not use Stripe; session refresh picks up `pro_granted_until` and treats the member as Pro for intelligence gates until expiry.

## Member profile

- **Promotions** — redeem Pro trial codes; shows trial end date when active.
- **Billing** — optional promo on pending/cancelled checkout.
- **Invite members** — granted affiliates see share links: `/join?ref=CODE&promo=VOUCHER`.

| Route | Purpose |
|-------|---------|
| `GET /api/vouchers/affiliate` | Affiliate promo cards for profile |

Join accepts `?promo=CODE` (persisted in sessionStorage with referral).

Expired Pro grants are cleared on session refresh (member quota restored).

## Billing interval

Vouchers can target `monthly`, `annual`, or `any`. Checkout passes the interval selected on `/join` or profile. Requires annual Stripe price env vars (see `docs/STRIPE.md`).
