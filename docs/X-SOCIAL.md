# X (Twitter) social automation

Keep the brand account active with **safe, on-brand** posts that link back to PortFuel. Start in dry run; turn on live posts only after copy review.

## Environment variables

Add to Vercel (Production) and local `.env`:

| Variable | Example | Purpose |
|----------|---------|---------|
| `X_API_ENABLED` | `false` | Master switch |
| `X_API_DRY_RUN` | `true` | Log posts without calling X API |
| `X_API_BEARER_TOKEN` | OAuth 2.0 user token | `tweet.write` scope required for live posts |
| `X_POST_FUELED` | `true` | Include latest Fueled desk call in cron batch |
| `X_POST_LEADERBOARD` | `true` | Include top-3 rankings snippet in cron batch |

`CRON_SECRET` must match Vercel cron `Authorization: Bearer …` (same as other crons).

## Getting API access

1. Create a project at [developer.x.com](https://developer.x.com).
2. Enable **OAuth 2.0** with user context and scopes: `tweet.read`, `tweet.write`, `users.read`.
3. Generate a user access token (or complete OAuth flow for your brand account).
4. Set `X_API_BEARER_TOKEN` in Vercel — never commit it to git.

## Admin UI

**Administration → Social**

- Preview **Fueled** or **rankings** post text (280-char limit enforced).
- **Dry-run post** — logs on the server, no X call.
- **Post to X** — live when `X_API_ENABLED=true`, `X_API_DRY_RUN=false`, and token is set.

Same tab includes **Tweet → Fueled draft** (inbound curation): paste tweet text → AI draft → continue in publish form or Desk admin.

## Cron

`GET /api/cron/x-social` — scheduled in `vercel.json` (Mondays, after weekly digest). Respects `X_POST_*` flags and dry run.

Manual test (local):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/x-social
```

## Post templates (v1)

- **Fueled** — latest `is_fueled` call → link to `/ticker/{symbol}` with UTM `utm_source=x`.
- **Leaderboard** — top 3 rank scores → link to `/rankings`.

Every template ends with: `Not investment advice.`

## Safety checklist

- [ ] Dry run previews look correct for a week
- [ ] Links use production `NEXT_PUBLIC_APP_URL`
- [ ] No price targets or “guaranteed” language in templates
- [ ] Rate: aim 3–5 posts/week max until engagement is measured

## Idempotency

Table `social_post_log` (`post_type` + `ref_id` unique) records live posts:

- **Fueled** — ref is the call UUID (latest desk call).
- **Leaderboard** — ref is `leaderboard-YYYY-MM-DD` (one post per week).

Cron and admin live posts skip content that was already sent. Dry runs do not write to the log.

Apply migration: `supabase/migrations/20260525900000_social_post_log.sql`
