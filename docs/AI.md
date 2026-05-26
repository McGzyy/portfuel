# AI thesis coach

Educational feedback on draft and published theses — **not** investment advice.

## Setup

Add to `.env.local` and Vercel:

```env
OPENAI_API_KEY=sk-...
# Optional:
AI_COACH_MODEL=gpt-4o-mini
```

Without `OPENAI_API_KEY`, the coach returns **demo-style** feedback in development (and when demo mode is on).

## Limits (calendar month, UTC)

### Thesis coach

| Tier | Reviews / month | Track record in prompt |
|------|-----------------|-------------------------|
| Member | 2 | No |
| Pro | 30 | Optional checkbox |
| Admin | 200 | Yes |

### One-line summaries

| Tier | Generate | Read cached |
|------|----------|-------------|
| Member | No | Yes (teaser) |
| Pro | 60 / month | Yes |
| Admin | 500 / month | Yes |

Summaries are stored per call in `call_thesis_summaries` — first Pro generation is cached for everyone.

Usage counters live in `user_ai_usage` — run migrations `20260525300000_ai_coach_usage.sql` and `20260525400000_call_thesis_summaries.sql`.

## API

- `GET /api/ai/thesis-coach` — remaining quota
- `POST /api/ai/thesis-coach` — run review (JSON body matches new-call fields)

## UI

- **Submit a call** (`/calls/new`) — “Review my thesis” before publish
- **Your profile** — monthly quota strip; thesis coach on each of your published calls
- **Ticker page** — thesis coach on your own call cards only
- **Feed, ticker, profiles** — **Quick summary** expand on each call (`Case: … · Risk: …`)

## Admin desk draft

**Admin → Desk** includes “Draft with AI” for weekly notes and portfolio theses (bullets → prose). Uses the same `OPENAI_API_KEY`; does not count against member coach quotas.

## Compliance

System prompts forbid buy/sell/hold and price targets. UI shows a fixed disclaimer on every response.
