# Marketing creative system — resume checklist

**Status:** Built locally, **not committed** as of last session. Use this doc to pick up where you left off.

Full workflow after merge: [BRAND-KIT.md](./BRAND-KIT.md) · asset URLs: [MARKETING-ASSETS.md](./MARKETING-ASSETS.md)

---

## What was built (local only)

| Area | Path |
|------|------|
| Brand tokens + AI prompt templates | `src/lib/marketing/brand-kit.ts` |
| OG + ad PNG renderers | `src/lib/charts/marketing-render.tsx` |
| OG API variants (`home`, `join`, `proof`, `desk`, `demo`) | `src/app/api/og/marketing/route.ts` |
| Ad API (`proof`, `structure`, `desk`; sizes `x`, `og`, `square`) | `src/app/api/og/ad/route.ts` |
| Admin → Marketing tab | `src/components/admin/AdminMarketingPanel.tsx`, `AdminShell.tsx` |
| Batch export script | `scripts/export-marketing-assets.mjs` |
| npm script | `npm run marketing:export` → `marketing-exports/` (gitignored) |
| Docs | `docs/BRAND-KIT.md`, updated `docs/MARKETING-ASSETS.md` |

**Verified locally:** `npm run marketing:export` writes 14 PNGs; `npx tsc --noEmit` passes.

---

## Before you commit

- [ ] Fix mobile bottom nav + More menu (see nav fixes in same branch or prior commit)
- [ ] Review generated PNGs in `marketing-exports/` — tweak copy/colors in `brand-kit.ts` if needed
- [ ] Smoke-test Admin → Marketing tab on preview deploy
- [ ] Do **not** commit test assets: `logo-test.png`, `resvg-test.png`, `social-chart-preview.png`, `scripts/preview-social-chart.mjs`, `scripts/test-*`

---

## Commit & deploy steps

1. Stage marketing files (exclude test PNGs above):

   ```powershell
   git add src/lib/marketing/ src/lib/charts/marketing-render.tsx src/lib/charts/marketing-og.tsx `
     src/app/api/og/marketing/ src/app/api/og/ad/ `
     src/components/admin/AdminMarketingPanel.tsx src/components/admin/AdminShell.tsx `
     scripts/export-marketing-assets.mjs package.json .gitignore `
     docs/BRAND-KIT.md docs/MARKETING-ASSETS.md docs/MARKETING-SETUP-TODO.md
   ```

2. Commit message suggestion: *Add brand kit, programmatic OG/ad generators, and admin marketing export panel.*

3. Push and confirm OG/ad routes on production:
   - `/api/og/marketing?variant=home`
   - `/api/og/ad?variant=proof&size=square`

---

## Quick commands

```powershell
npm run marketing:export    # refresh all PNGs locally
npx tsc --noEmit            # typecheck
```

---

## Optional next (not in scope yet)

- Figma component library from brand tokens
- Scheduled social posts using exported cards ([X-SOCIAL.md](./X-SOCIAL.md))
- A/B variants for paid ads (duplicate `brand-kit.ts` copy blocks)
