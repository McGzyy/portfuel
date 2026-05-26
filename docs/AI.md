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

| Tier | Reviews / month | Track record in prompt |
|------|-----------------|-------------------------|
| Member | 2 | No |
| Pro | 30 | Optional checkbox |
| Admin | 200 | Yes |

Usage is stored in `user_ai_usage` — run migration `20260525300000_ai_coach_usage.sql`.

## API

- `GET /api/ai/thesis-coach` — remaining quota
- `POST /api/ai/thesis-coach` — run review (JSON body matches new-call fields)

## UI

- **Submit a call** (`/calls/new`) — “Review my thesis” before publish

## Compliance

System prompts forbid buy/sell/hold and price targets. UI shows a fixed disclaimer on every response.
