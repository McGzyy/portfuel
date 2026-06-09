# X (Twitter) social automation

Keep the brand account active with **safe, on-brand** posts that link back to PortFuel. Start in dry run; turn on live posts only after copy review.

**Full growth strategy (member wins, quote tweets, ads, calendar):** [MARKETING-PLAN.md](./MARKETING-PLAN.md)

## Environment variables

Add to Vercel (Production) and local `.env`:

| Variable | Example | Purpose |
|----------|---------|---------|
| `X_API_ENABLED` | `false` | Master switch |
| `X_API_DRY_RUN` | `true` | Log posts without calling X API |
| `X_API_BEARER_TOKEN` | OAuth 2.0 user token | `tweet.write` scope required for live posts |
| `X_POST_FUELED` | `true` | Include latest Fueled desk call in cron batch |
| `X_POST_LEADERBOARD` | `true` | Include top-3 rankings snippet in cron batch |
| `X_AUTOPOST_FUELED_ON_PUBLISH` | `false` | When an admin publishes a Fueled call, auto-post text to X (respects dry run + idempotency per call) |
| `X_AUTOPOST_MILESTONES` | `false` | After quote refresh, auto-post Fueled desk milestone charts (+10%, +25%, target). **Keep `false` until you dry-run approve copy in Admin → Social.** |
| `X_POST_MEMBER_WINS` | `false` | Cron: post one opted-in member win per run (when eligible) |
| `X_MEMBER_WIN_MIN_RETURN_PCT` | `20` | Normal path minimum return % |
| `X_MEMBER_WIN_MIN_AGE_HOURS` | `48` | Normal path minimum hours since call |
| `X_MEMBER_WIN_FAST_TRACK_RETURN_PCT` | `30` | Exceptional outcome shorter age path |
| `X_MEMBER_WIN_FAST_TRACK_MIN_AGE_HOURS` | `36` | Minimum age for fast track |
| `X_MEMBER_WIN_SUSTAIN_HOURS` | `48` | Review window after qualifying before posting |
| `X_POST_MEMBER_WIN_UPDATES` | `false` | Quote-tweet the original spotlight at +25% or target |
| `X_POST_MEMBER_WIN_STILL_RUNNING` | `false` | Quote-tweet “still running” when return is ≥15% and &lt;25% (after spotlight) |
| `X_MEMBER_WIN_STILL_RUNNING_MIN_PCT` | `15` | Minimum return % for still-running update |

After migration, run `supabase/scripts/update-member-win-professional-copy.sql` if templates were created with older copy. Apply `20260605200000_member_win_update_copy.sql` and `20260605300000_weekly_digest.sql` for newer templates.

| `X_POST_WEEKLY_DIGEST` | `false` | Weekly top-3 composite image + recap tweet |
| `X_MEMBER_WIN_SYMBOL_BLOCKLIST` | _(empty)_ | Comma-separated tickers excluded from member spotlight |
| `X_COPY_AB_ENABLED` | `false` | Split member spotlight/update copy between `default` and `variant_b` |
| `X_COPY_AB_PERCENT` | `50` | Percent of posts assigned to variant B (0–100, by call id hash) |
| `X_POST_COPY_VARIANT` | _(empty)_ | Force `default` or `variant_b` for all member posts (overrides A/B) |

`CRON_SECRET` must match Vercel cron `Authorization: Bearer …` (same as other crons).

Apply migration `20260606100000_social_copy_variant_b.sql` for the variant B template row and `copy_variant` column on `social_post_log`.

## Getting API access

1. Create a project at [developer.x.com](https://developer.x.com).
2. Enable **OAuth 2.0** with user context and scopes: `tweet.read`, `tweet.write`, `users.read`.
3. Generate a user access token (or complete OAuth flow for your brand account).
4. Set `X_API_BEARER_TOKEN` in Vercel — never commit it to git.

## Admin UI

**Administration → Social**

- Preview **Fueled** or **rankings** post text (280-char limit enforced).
- **Member wins** queue — opted-in members, chart + thesis (see env thresholds).
- **Activity & queue** — published `social_post_log` vs ready-to-publish pipeline.
- **Dry-run post** — logs on the server, no X call.
- **Post to X** — live when `X_API_ENABLED=true`, `X_API_DRY_RUN=false`, and token is set.
- **Force repost** — bypasses idempotency for manual posts.

Inbound curation lives on **Admin → X Ingest** (linked from the Social tab): paste an X post URL (with optional text backup) → per-ticker context → **Analyze** → publish Fueled call.

**Tweet URL fetch:** PortFuel tries X API v2 when `X_API_BEARER_TOKEN` is set; if that fails (common on free tier: `client-not-enrolled` / no read access), it falls back to X’s public oEmbed endpoint (no extra cost). Manual paste still works as backup. `OPENAI_API_KEY` is required for AI analysis.

## Cron

`GET /api/cron/x-social` — scheduled in `vercel.json` (Mondays). Handles text-only **Fueled desk**, **leaderboard**, **member wins**, and **weekly digest**. Respects `X_POST_*` flags and dry run.

**Fueled milestone chart posts** are **not** in this cron. They autopost when quote refresh detects a new milestone (`processCallMilestones` → `tryAutopostFueledMilestone`), gated by `X_AUTOPOST_MILESTONES`. Manual posts: Admin → Social → Milestone charts.

Manual test (local):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/x-social
```

## Post templates (v1)

- **Fueled** — latest `is_fueled` call → link to `/ticker/{symbol}` with UTM `utm_source=x`.
- **Fueled milestone** — desk call at +10%, +25%, or target reached → **chart PNG** attached (`/api/social/chart/{callId}?milestone=…`). Admin → Social → Milestone charts.
- **Leaderboard** — top 3 rank scores → link to `/rankings`.

### Chart images

- Dark branded 1200×675 PNG: candles, Fueled square marker, member long/short arrows, desk entry/target/stop lines.
- Logo: place **`public/logo-light.png`** (light mark on dark). Falls back to `public/logo.png`.
- Preview: `GET /api/social/chart/{callId}?milestone=return_10&format=png` (or `format=svg`).

Every template ends with: `Not investment advice.`

## Safety checklist

- [ ] Dry run previews look correct for a week
- [ ] Links use production `NEXT_PUBLIC_APP_URL`
- [ ] No price targets or “guaranteed” language in templates
- [ ] Rate: aim 3–5 posts/week max until engagement is measured

## Staging rollout (recommended order)

Use this before flipping live posts in production.

### Phase 1 — Dry run only

1. Set on **Preview** or staging Vercel env:
   - `X_API_ENABLED=true`
   - `X_API_DRY_RUN=true`
   - `X_API_BEARER_TOKEN=` (optional for ingest; required later for live)
2. Run milestone chart preview: `GET /api/social/chart/{callId}?milestone=return_10&format=png`
3. Admin → Social → **Dry-run post** for Fueled + leaderboard copy
4. Cron dry run:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-PREVIEW-URL/api/cron/x-social
   ```
5. Confirm server logs show post text + chart attachment paths; **no** rows in `social_post_log` from dry run

### Phase 2 — Live on staging

1. Set `X_API_DRY_RUN=false` on a **test X account** or restricted brand account
2. Admin → Social → **Dry-run post** on a milestone chart, then **Post to X with chart** once manually; verify link + chart PNG
3. Publish or refresh quotes on a Fueled desk call at a milestone; confirm autopost only when `X_AUTOPOST_MILESTONES=true` (fires on quote refresh, not Monday cron)
4. Review `social_post_log` for idempotency (re-run cron — should skip duplicates)

### Phase 3 — Production

1. Copy verified env vars to **Production**
2. Enable flags one at a time: `X_AUTOPOST_MILESTONES` → `X_POST_FUELED` → `X_POST_LEADERBOARD`
3. Keep `X_POST_MEMBER_WINS=false` until opt-in members exist and copy is reviewed
4. Monitor Vercel function logs for 403/429 from X API

## Idempotency

Table `social_post_log` (`post_type` + `ref_id` unique) records live posts:

- **Fueled** — ref is the call UUID (latest desk call).
- **Leaderboard** — ref is `leaderboard-YYYY-MM-DD` (one post per week).

Cron and admin live posts skip content that was already sent. Dry runs do not write to the log.

Apply migration: `supabase/migrations/20260525900000_social_post_log.sql`
