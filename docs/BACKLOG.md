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
- Auto-posting to X from PortFuel.
- Member-facing “import tweet” (admin only).

### Success criteria

- Admin can go tweet → published Fueled call in &lt; 5 minutes with one symbol choice step.
- Zero accidental multi-ticker calls without explicit selection.

---

## Other ideas (unscoped)

- Tweet/thread **embed** on desk weekly note (read-only).
- “Founding member” badge for first N accounts.
- Public **read-only** demo workspace URL (no login) for marketing.
