# Product backlog (deferred features)

Items captured for later — not in active development unless promoted to [VALUE-ROADMAP.md](./VALUE-ROADMAP.md).

---

## Admin: Tweet → Fueled call (AI draft)

**Status:** Deferred — do not implement until prioritized.

### Problem

Curated narratives often start on X/Twitter. Admin wants to paste a tweet (or thread excerpt), get an AI-drafted **Fueled** desk call, choose the right symbol when multiple tickers are mentioned, edit, then publish.

### User flow (target)

1. Admin opens **Admin → Desk** (or future **Admin → Social** tab).
2. Pastes tweet URL or raw text (+ optional admin note: “why this matters”).
3. System extracts:
   - Candidate tickers (`$NVDA`, `NVDA`, cashtags, company names via map).
   - Suggested direction, timeframe, thesis bullets, entry/target/stop *drafts* (clearly labeled as drafts).
4. Admin **selects one primary symbol** (required if multiple).
5. Admin edits thesis and levels in existing desk / call form.
6. Publish as **Fueled** call (`is_fueled: true`) — same path as today’s house research.

### Technical notes (when we build)

| Area | Approach |
|------|----------|
| Ticker detection | Regex + `symbol` master list; disambiguation UI (radio list). |
| AI | Reuse `src/lib/ai/desk-draft.ts` patterns; new prompt `tweet-to-desk-draft`; structured JSON output (Zod). |
| Storage | Optional `admin_social_drafts` table: `raw_text`, `source_url`, `parsed_json`, `chosen_symbol`, `call_id`. |
| Safety | “Not investment advice”; admin must confirm before publish; no auto-post. |
| API | `POST /api/admin/desk/from-tweet` → returns draft only; separate publish uses existing call create. |

### Out of scope (v1 of this feature)

- Auto-scraping X API / monitoring accounts.
- Member-facing “import tweet” (admin only).

---

## X (Twitter): automated posts to keep the account active

**Status:** Deferred — product discovery; do not implement until API access and content policy are defined.

### Problem

The brand X account needs regular activity before launch traffic matters. Manual posting does not scale; we want **safe, on-brand automation** that drives people to PortFuel without spam or compliance risk.

### Candidate post types (evaluate later)

| Type | Source | Notes |
|------|--------|--------|
| New **Fueled** desk call | `calls` where `is_fueled` | Link to ticker or call; admin-approved template. |
| **Winning / milestone** call | Cron after quote refresh | Only when threshold met; avoid noise. |
| **Weekly leaderboard** snippet | Rankings job | Top 3 + link to `/rankings`. |
| **Market pulse** | Hot tickers from member calls | “Members watching NVDA” — no price advice. |
| **Launch / digest** | Admin Launch checklist | Human-triggered first; automate when stable. |

### Technical notes (when we build)

| Area | Approach |
|------|----------|
| API | X API v2 (OAuth 2.0 user context or app-only for read); store tokens in env / Vercel secrets. |
| Queue | Cron or Workflow: `POST /api/cron/x-digest` with idempotency keys per post type. |
| Safety | Dry-run mode, admin toggle per post type, rate limits, “not investment advice” footer, block list for symbols. |
| Draft | Optional Admin preview before first automated send. |
| Linking | UTM params (`utm_source=x&utm_medium=social`) on all outbound URLs. |

### Out of scope (v1)

- Auto-replying to mentions or DMs.
- Scraping other accounts’ tweets (see Tweet → Fueled for **inbound** curation only).
- Posting member UGC without explicit opt-in.

### Success criteria

- Account posts 3–5×/week with zero manual copy-paste.
- Every post links back to a real PortFuel page with measurable clicks.
- No regulatory-style claims (“guaranteed”, “buy now”) in templates.

### Success criteria

- Admin can go tweet → published Fueled call in &lt; 5 minutes with one symbol choice step.
- Zero accidental multi-ticker calls without explicit selection.

---

## Other ideas (unscoped)

- Tweet/thread **embed** on desk weekly note (read-only).
- “Founding member” badge for first N accounts.
- Public **read-only** demo workspace URL (no login) for marketing.
