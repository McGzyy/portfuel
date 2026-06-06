# Journal → publish E2E checklist

Run on **staging** (or production) with a real member account after journal migrations are applied. See [MIGRATIONS.md](./MIGRATIONS.md).

## Setup

- [ ] Migrations through `20260610100000_journal_entries_phase4.sql` applied
- [ ] `OPENAI_API_KEY` set (for AI research step)
- [ ] Member account with an empty watchlist slot

## Flow

1. **Track** — `/dashboard/watchlist` → add `AAPL` (or any valid symbol)
2. **Redirect** — lands on `/dashboard/journal/AAPL?setup=1`
3. **Thesis & plan** — fill thesis, catalysts, entry/target, save plan
4. **Log entries** — add 2 manual entries (earnings + price action) on timeline
5. **AI research** — run review on `/dashboard/journal/AAPL#journal-research`; confirm entry saves to timeline
6. **Checklist** — confirm 4/4 required steps; **Publish call** CTA appears
7. **Hub banner** — `/dashboard/journal` shows ready-to-publish banner for the symbol
8. **Publish preview** — click Publish → `/calls/new?from=journal&…` shows community preview card
9. **Submit** — publish call; confirm redirect to `/ticker/{SYMBOL}?published=1`
10. **Feed** — call appears on `/dashboard/feed`

## Alert deep-links (optional)

- [ ] Earnings alert href includes `?entry=earnings#journal-entries`
- [ ] Price move alert opens `#journal-entries`
- [ ] Plan level alert opens `#journal-plan`

## Weekly digest (optional)

- [ ] `email_digest_enabled` on test user
- [ ] Manual trigger: `GET /api/cron/weekly-digest` with `Authorization: Bearer $CRON_SECRET`
- [ ] Email includes **Research journal** section when watchlist has symbols
