# Email alerts (Resend)

PortFuel sends **in-app** notifications plus optional **email** via [Resend](https://resend.com).

## What sends

| Channel | Event |
|--------|--------|
| In-app | Comments, votes, watchlist new calls |
| Instant email | Watchlist new call, comment on your call, followed member new call |
| Weekly digest | Desk stats, hot calls, unread count (Mondays 14:00 UTC) |

Votes do not trigger email (too noisy).

## Setup

1. Create a Resend account and verify your sending domain (`portfuel.pro`).
2. Add to `.env.local` and Vercel:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=PortFuel <notifications@portfuel.pro>
NEXT_PUBLIC_APP_URL=https://portfuel.pro
CRON_SECRET=...   # already used for other crons
```

3. Run migration `supabase/migrations/20260524800000_user_email_notifications.sql` in Supabase SQL editor.

4. Members add an address under **Profile → Email alerts**.

## Cron

`vercel.json` runs `GET /api/cron/weekly-digest` every Monday at 14:00 UTC with `Authorization: Bearer $CRON_SECRET`.

Manual test (local):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/weekly-digest
```

## Development

Without `RESEND_API_KEY`, in-app notifications still work; the profile panel shows that email is not configured.

Resend sandbox: use `onboarding@resend.dev` as `EMAIL_FROM` only to send to your verified Resend account email.
