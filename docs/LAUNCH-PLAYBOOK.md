# Launch playbook (solo founder / early community)

PortFuel feels “dry” when the **feed and rankings are empty**. That is normal before members arrive. The product is built to look alive when **you** consistently publish house research and a handful of real members show up.

You do not need to be a market expert — you need a **repeatable rhythm** and honest positioning: *curated community intelligence*, not “we beat the market.”

---

## What makes the site feel alive

| Signal | Who creates it | Where it shows |
|--------|----------------|----------------|
| **Fueled desk calls** | You (admin) | Desk, overview, feed (Fueled filter), ticker charts |
| **Weekly desk note** | You | Desk hero, overview desk card |
| **Model portfolio rows** | You | Desk, overview sidebar |
| **Member calls** | Paying members | Feed, rankings, hot tickers |
| **Landing teasers** | System | Homepage — only calls that pass **public performance thresholds** |

If everything is empty, enable **preview mode** (see below) for demos and screenshots, then switch to live data as you publish.

---

## Week 0 checklist (before inviting anyone)

1. **Publish 2–3 Fueled calls** on liquid symbols you can explain (Admin → Desk).
2. **Write a weekly desk note** (2–4 sentences: macro or sector narrative).
3. **Add 3–5 model portfolio positions** aligned with those theses (optional but strong on overview).
4. **Publish 1–2 of your own member calls** so your profile and return chart exist.
5. **Run quote refresh** — cron on Vercel should handle this; confirm tickers show prices.
6. **Invite 3–5 founding members** personally (DM/email) — not a public launch post yet.
7. **Use preview mode** only for sales calls; production should use real data when possible.

Admin UI: **Administration → Launch** tab for this checklist in the app.

---

## Preview mode (`NEXT_PUBLIC_DEMO_MODE=true`)

- Fills feed, rankings, messages, and watchlist with **fixtures** from `src/lib/demo/fixtures.ts`.
- Shows an amber banner: “Preview mode.”
- Use for: Loom demos, investor screenshots, testing UI without seeding DB.
- **Do not** leave on in production if you want authentic social proof.

---

## You don’t need to “know everything”

Members pay for **structure**, not omniscience:

- **Attributed calls** on a chart (entry, target, stop, return %).
- **Reputation** (rankings, win rate, trusted badge over time).
- **House lane** (Fueled desk) separate from the crowd.
- **Research tools** (Pro) on top of the same tickers.

Your job early: **curate quality over quantity** — a few good Fueled theses beat twenty vague hot takes.

---

## When it still feels quiet

- Post desk content **weekly** (note + at least one thesis).
- Ask founding members to publish **one call** and comment on someone else’s.
- Link ticker pages in desk notes (“full chart on `$NVDA`”).
- After ~10 real member calls, landing teasers and hot tickers start populating themselves.

---

## Related docs

- [VALUE-ROADMAP.md](./VALUE-ROADMAP.md) — product priorities
- [MARKETING-PLAN.md](./MARKETING-PLAN.md) — X content calendar, member win posts, ads, automation phases
- [MARKETING-ASSETS.md](./MARKETING-ASSETS.md) — ad sizes, UTMs, creative angles
- [BACKLOG.md](./BACKLOG.md) — deferred features (e.g. tweet → Fueled draft)
- [DEVELOPMENT.md](./DEVELOPMENT.md) — migrations, env, deploy
