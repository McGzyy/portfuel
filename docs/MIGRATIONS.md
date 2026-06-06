# Supabase migrations

Apply **every** file in `supabase/migrations/` in filename order (oldest first). Use the Supabase SQL Editor, CLI (`supabase db push`), or your deployment pipeline.

**43 migrations** as of journal phase 4.

Verify locally:

```bash
node scripts/list-migrations.mjs
```

## Fresh environment checklist

After applying migrations:

1. `node --env-file=.env.local scripts/set-admin-password.mjs`
2. `node --env-file=.env.local scripts/seed.mjs` (or reset TOTP)
3. Trigger crypto allowlist cron once in production
4. Confirm Vercel env vars match `.env.example`

## Full migration order (43 files)

| # | File | Feature |
|---|------|---------|
| 1 | `20260524000001_initial.sql` | Core schema |
| 2 | `20260524100000_asset_class_crypto.sql` | Crypto asset class |
| 3 | `20260524200000_public_teaser_gates.sql` | Public landing teasers |
| 4 | `20260524300000_username_password_auth.sql` | Username + password auth |
| 5 | `20260524400000_user_watchlist.sql` | Watchlist |
| 6 | `20260524500000_stripe_billing.sql` | Stripe billing |
| 7 | `20260524600000_watchlist_baseline.sql` | Watchlist baseline prices |
| 8 | `20260524700000_user_notifications.sql` | In-app notifications |
| 9 | `20260524800000_user_email_notifications.sql` | Email notification prefs |
| 10 | `20260524900000_user_follows.sql` | Follow graph |
| 11 | `20260525000000_desk_brief.sql` | Fueled desk weekly note |
| 12 | `20260525100000_desk_portfolio.sql` | Model portfolio |
| 13 | `20260525200000_desk_portfolio_notifications.sql` | Desk portfolio alerts |
| 14 | `20260525300000_ai_coach_usage.sql` | AI coach usage counters |
| 15 | `20260525400000_call_thesis_summaries.sql` | AI call summaries |
| 16 | `20260525500000_call_milestones.sql` | Call milestones (+10/+25/target) |
| 17 | `20260525600000_user_onboarding.sql` | Onboarding state |
| 18 | `20260525700000_direct_messages.sql` | DMs |
| 19 | `20260525800000_dm_typing.sql` | DM typing indicators |
| 20 | `20260525900000_social_post_log.sql` | X social post log |
| 21 | `20260526000000_call_source_tweet_url.sql` | Admin X ingest attribution |
| 22 | `20260529000000_social_post_copy.sql` | Social post copy templates |
| 23 | `20260530120000_user_referrals.sql` | Referrals (legacy) |
| 24 | `20260601000000_discord_linking.sql` | Discord linking |
| 25 | `20260601000001_discord_outbox.sql` | Discord outbox |
| 26 | `20260602000000_discord_verify_reminders.sql` | Discord verify reminders |
| 27 | `20260603100000_vouchers.sql` | Vouchers |
| 28 | `20260603110000_billing_interval.sql` | Annual billing interval |
| 29 | `20260604120000_admin_social_analysis_cache.sql` | Admin social analysis cache |
| 30 | `20260604121500_call_research_snapshots.sql` | Call research snapshots |
| 31 | `20260604130000_last_active_at.sql` | Last active timestamp |
| 32 | `20260604133000_ai_draft_requests.sql` | AI draft request logging |
| 33 | `20260605120000_member_social_highlight.sql` | Member social highlight opt-in |
| 34 | `20260605200000_member_win_update_copy.sql` | Member win update copy |
| 35 | `20260605300000_weekly_digest.sql` | Weekly email digest |
| 36 | `20260606100000_social_copy_variant_b.sql` | Social copy A/B variant B |
| 37 | `20260607095000_referral_program.sql` | Referral program + credits |
| 38 | `20260607100000_watchlist_journal.sql` | Journal thesis + plan on watchlist |
| 39 | `20260607110000_journal_entry_markers.sql` | Journal entry chart markers |
| 40 | `20260607120000_watchlist_journal_phase2.sql` | Journal phase 2 fields |
| 41 | `20260608100000_watchlist_alerts.sql` | Watchlist alert engine |
| 42 | `20260609100000_journal_research_ai.sql` | AI journal research usage |
| 43 | `20260610100000_journal_entries_phase4.sql` | Entry types + metadata |

> **Note:** `20260607095000_referral_program.sql` was renamed from a duplicate `20260607100000` timestamp so journal migrations apply in a deterministic order on fresh databases.

## Journal-specific (required for research notebook)

If journal features fail or symbol pages 404 in production, confirm these are applied:

- `20260607100000_watchlist_journal.sql`
- `20260607110000_journal_entry_markers.sql`
- `20260607120000_watchlist_journal_phase2.sql`
- `20260608100000_watchlist_alerts.sql`
- `20260609100000_journal_research_ai.sql`
- `20260610100000_journal_entries_phase4.sql`

## Staging validation

See [JOURNAL-E2E.md](./JOURNAL-E2E.md) for the journal → publish smoke checklist.
