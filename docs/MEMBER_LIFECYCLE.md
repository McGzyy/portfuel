# Member lifecycle

Email verification, moderation, password reset, and admin Member 360.

## Funnel order (paying members)

1. Stripe checkout completes
2. **Verify email** (`/verify-email`) — friendly post-pay screen
3. **2FA setup** (`/security/2fa`)
4. Onboarding → workspace

Comp / invite signups skip Stripe email mismatch; they still verify email when `REQUIRE_EMAIL_VERIFICATION` is enabled.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `RESEND_API_KEY` + `EMAIL_FROM` | — | Required for verification and password-reset emails |
| `REQUIRE_EMAIL_VERIFICATION` | on when email configured | Set `false` to disable gate (e.g. local dev) |
| `NEXT_PUBLIC_ANNUAL_BILLING_ENABLED` | `false` | Show annual plan toggle on join/profile |

## Email verification

- Unique verified email per account (DB partial unique index)
- Stripe checkout stores `stripe_checkout_email`; mismatch UI lets member pick Stripe vs signup email
- Links: `/verify-email`, confirm via `/verify-email/confirm?token=…`
- APIs: `GET/POST/PATCH /api/auth/verify-email`, `POST /api/auth/verify-email/confirm`

## Moderation (separate from billing)

Presets on admin Member 360 (`/admin/members/[userId]`):

| Preset | Workspace | Calls | DMs | Comments |
|--------|-----------|-------|-----|----------|
| read_only | yes | no | no | no |
| no_calls | yes | no | yes | yes |
| no_dm | yes | yes | no | yes |
| full_lock | no | no | no | no |

- **Ban** — cannot log in (`account_banned` on login)
- Optional `moderation_expires_at` auto-clears restrictions

API enforcement: publish calls, comments, DMs check session flags (admins exempt).

## Password reset

- Request: `POST /api/auth/password-reset` with `{ email }` (verified emails only)
- Confirm: `PATCH` with `{ token, password }`
- UI: `/forgot-password`, `/reset-password?token=…`

## Admin audit

`admin_audit_log` records ban/unban, moderation presets, and member field updates from Member 360.

## Marketing opt-in

Separate booleans on `users`: `marketing_member_opt_in`, `marketing_pro_opt_in`. Members manage these on **Profile → Email & notifications**; admins can toggle on Member 360.

## Migration

Apply migrations on Supabase (in order if not yet applied):

1. `20260603100000_vouchers.sql`
2. `20260603110000_billing_interval.sql`
3. `20260602150000_member_lifecycle.sql`

```bash
npx supabase db push
```

Or run SQL in the Supabase dashboard SQL editor.
