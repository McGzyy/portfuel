# Member referral program

Cursor-style referrals: friends get a **first-month discount** at checkout; you earn **Stripe billing credit** when they activate.

## Member experience

**Profile → Referrals**

- Copy share link (`/join?ref=YOUR_USERNAME`)
- Invite by email (comma-separated, max 10 per send)
- View referral history (signups, invites, credits)

## Rewards (defaults — env-tunable)

| Party | Benefit | Default |
|-------|---------|---------|
| Friend (referee) | First month discount at Stripe checkout | 50% off (`REFERRAL_REFEREE_FIRST_MONTH_OFF_PCT`) |
| You (referrer) | Stripe customer balance credit | $25 (`REFERRAL_REFERRER_REWARD_CENTS=2500`) |
| Cap | Referrer rewards per calendar month | 10 (`REFERRAL_MAX_REWARDS_PER_MONTH`) |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `REFERRAL_PROGRAM_ENABLED` | `true` / `false` (default `true`) |
| `REFERRAL_REFERRER_REWARD_CENTS` | Referrer credit in USD cents (default `2500`) |
| `REFERRAL_MAX_REWARDS_PER_MONTH` | Monthly reward count cap (default `10`) |
| `REFERRAL_REFEREE_FIRST_MONTH_OFF_PCT` | Shown in UI copy (default `50`) |
| `STRIPE_REFERRAL_PROMOTION_CODE_ID` | Stripe **promotion_code** id (not coupon id) for referee discount |
| `RESEND_API_KEY` | Required for email invites |

### Stripe setup (referee discount)

1. In Stripe Dashboard → Products → Coupons, create a coupon (e.g. **50% off once**).
2. Create a **Promotion code** linked to that coupon.
3. Set `STRIPE_REFERRAL_PROMOTION_CODE_ID` to the promotion code id (`promo_…`).

Checkout applies this code automatically when the user has `referred_by_user_id` and chooses **monthly** billing (voucher codes take precedence).

### Referrer credit

On first paid activation, PortFuel calls `stripe.customers.createBalanceTransaction` with a **negative** amount (credit) on the referrer’s `stripe_customer_id`. Referrers need an active Stripe customer on file; otherwise the reward is logged as `skipped_no_customer`.

## Database

Migration: `supabase/migrations/20260607100000_referral_program.sql`

- `referral_invites` — email invites
- `referral_rewards` — ledger (applied / cap / pending)
- `users.referral_credit_balance_cents` — running total

Existing: `user_referrals`, `users.referral_code`, `users.referred_by_user_id`.

## Marketing

- UTM: `utm_source=referral&utm_medium=member&utm_campaign=invite`
- Spotlight template can mention “Track your calls on PortFuel” with the member’s link (optional copy edit in Admin → Social)

See [MARKETING-PLAN.md](./MARKETING-PLAN.md) §8.2.
