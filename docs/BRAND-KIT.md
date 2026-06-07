# PortFuel brand kit & marketing creative system

Companion to [MARKETING-ASSETS.md](./MARKETING-ASSETS.md) and [MARKETING-PLAN.md](./MARKETING-PLAN.md).

**Goal:** Every outbound image looks like it came from the same product — without generating one-off AI art for core proof.

---

## 1. Two buckets (use the right tool)

| Bucket | What | Tool |
|--------|------|------|
| **A — Product & proof (80%)** | Call charts, OG cards, UI screenshots, rankings | Code-generated PNGs + real screenshots |
| **B — Atmosphere (20%)** | Abstract backgrounds, texture plates | AI (with locked style reference) + Figma composite |

**Never** use AI for: performance claims, chart data, logos, or full ads.

---

## 2. Brand tokens (copy into Figma / Canva)

| Token | Hex | Use |
|-------|-----|-----|
| Background | `#0F1419` | Dark marketing panels, OG cards |
| Surface | `#1A2332` | Cards, footers |
| Surface alt | `#243044` | Chart placeholder areas |
| Text | `#94A3B8` | Body, eyebrows |
| Text bright | `#F8FAFC` | Headlines |
| Accent | `#E31B23` | PortFuel red, CTAs |
| Up / win | `#059669` | Positive return |
| Font | **Inter** 400 / 500 / 600 / 700 | Matches app + PNG generators |

Source of truth in code: `src/lib/marketing/brand-kit.ts`

---

## 3. Programmatic assets (generated in-app)

### Admin UI

**Admin → Marketing** — preview and download all templates, copy AI prompts, build chart URLs.

### API routes (public PNG)

| URL | Size | Purpose |
|-----|------|---------|
| `/api/og/marketing?variant=home` | 1200×630 | Homepage OG |
| `/api/og/marketing?variant=join` | 1200×630 | Join / signup |
| `/api/og/marketing?variant=proof` | 1200×630 | Proof angle |
| `/api/og/marketing?variant=desk` | 1200×630 | Fueled desk angle |
| `/api/og/marketing?variant=demo` | 1200×630 | Demo workspace CTA |
| `/api/og/ad?variant=proof&size=x` | 1200×675 | X / LinkedIn landscape ad |
| `/api/og/ad?variant=structure&size=square` | 1080×1080 | Meta square ad |
| `/api/og/ad?variant=desk&headline=…` | any | Custom headline |
| `/api/social/chart/{callId}?format=png` | 1200×675 | **Best creative** — real call chart |

Variants: `proof` · `structure` · `desk`  
Sizes: `x` (1200×675) · `og` (1200×630) · `square` (1080×1080)

### Batch export (local)

```bash
npm run marketing:export
```

Writes PNGs to `marketing-exports/` for Figma import.

---

## 4. Weekly workflow (solo founder)

1. **Pick proof** — Admin → Social → milestone or member win with chart.
2. **Export templates** — Admin → Marketing → download OG + ad cards (or `npm run marketing:export`).
3. **Composite in Figma** — Template: chart 58% left, headline + CTA right, disclaimer footer.
4. **Post organic** — X with UTM; note which variant performs.
5. **Paid** — Boost top organic post; use same PNG, add `utm_medium=paid`.

---

## 5. Figma setup (one-time, ~2 hours)

1. Create file **PortFuel Marketing**
2. Add color styles from §2
3. Add text styles: Inter 48/700 headline, 20/500 sub, 11/600 eyebrow
4. Create frames: 1200×630, 1200×675, 1080×1080
5. Components:
   - Logo lockup (import from `public/logo.png`)
   - Disclaimer bar: “Not investment advice · portfuel.pro”
   - CTA button: red fill, white text, 10px radius
   - Chart frame: 16:9 placeholder (drop PNG from API)
6. Templates:
   - **Proof ad** — chart + “Calls on record. Returns tracked.”
   - **Structure ad** — `/demo` screenshot in device frame
   - **Carousel** — 3 slides: proof / desk / join

Checklist also in `brand-kit.ts` → `FIGMA_CHECKLIST`.

---

## 6. AI backgrounds (optional)

Use **only** for backdrop layers behind real product PNGs.

### Master prompt (copy from Admin → Marketing)

See `AI_BACKGROUND_PROMPT` in `src/lib/marketing/brand-kit.ts`.

### Tooling

| Tool | Best for |
|------|----------|
| **Midjourney** | Style-locked backgrounds (`--sref` from one approved master) |
| **Ideogram** | Headlines baked into simple layouts |
| **Recraft** | Vector icons, flat illustrations on-brand |
| **Figma** | Final assembly — always |

### Process

1. Generate 2–3 backgrounds with the master prompt
2. Pick one winner → save as **style reference**
3. Every new background: same prompt + same `--sref`
4. Import to Figma beneath chart PNG — never ship raw AI alone

### Negative prompt

See `AI_NEGATIVE_PROMPT` in brand-kit (no coins, rockets, text, logos).

---

## 7. Voice & compliance

- Say: “member call on record”, “since publication”, “on PortFuel”
- Never: guaranteed returns, “before the move”, anonymous flexing
- Footer on every ad/social: **Not investment advice**
- Public proof only after performance gates (see MARKETING-PLAN.md §4)

---

## 8. What not to do

- One ChatGPT image at a time with no style kit
- Mixing stock photos, AI art, and product UI in one campaign
- AI-generated logos or wordmarks
- Posting fresh entries on X (members-only timing)

---

## Related

- [MARKETING-ASSETS.md](./MARKETING-ASSETS.md) — sizes, UTMs, ad angles
- [X-SOCIAL.md](./X-SOCIAL.md) — automated chart posts
- `src/lib/charts/social-chart*.ts` — milestone chart renderer
