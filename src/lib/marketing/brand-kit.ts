/** Single source for marketing colors, sizes, and AI prompt templates. */

/** PortFuel marketing palette — neutral charcoal + red (no blue-navy). */
export const MARKETING_RENDER_REVISION = 7;

export const MARKETING_BRAND = {
  bg: "#0f1419",
  bgDeep: "#0a0a0a",
  /** Neutral charcoal — matches dark-mode `--pf-surface: #111111`, not slate navy */
  surface: "#141414",
  surfaceRaised: "#1a1a1a",
  bgGradient: "linear-gradient(160deg, #0f1419 0%, #111111 42%, #1a0e10 100%)",
  text: "#94a3b8",
  textBright: "#f8fafc",
  textMuted: "#cbd5e1",
  textDim: "#64748b",
  accentRed: "#e31b23",
  accentRedHover: "#c41820",
  rule: "#2e2e2e",
  chipBg: "rgba(20, 20, 20, 0.9)",
  chipBorder: "rgba(255, 255, 255, 0.1)",
  chipText: "#e5e7eb",
  up: "#059669",
  down: "#e31b23",
  target: "#059669",
  areaUp: "rgba(5, 150, 105, 0.12)",
  chartGrid: "rgba(255, 255, 255, 0.06)",
  font: "Inter, ui-sans-serif, system-ui, sans-serif",
} as const;

export const MARKETING_SIZES = {
  og: { width: 1200, height: 630, label: "Open Graph / Meta link preview" },
  x: { width: 1200, height: 675, label: "X (Twitter) / LinkedIn landscape" },
  square: { width: 1080, height: 1080, label: "Meta / Instagram square" },
} as const;

export type MarketingOgVariant = "home" | "join" | "proof" | "desk" | "demo";

export type MarketingAdVariant = "proof" | "structure" | "desk";

export type MarketingSizeKey = keyof typeof MARKETING_SIZES;

export const MARKETING_OG_COPY: Record<
  MarketingOgVariant,
  { eyebrow: string; headline: string; sub: string; bullets: string[] }
> = {
  home: {
    eyebrow: "PORTFUEL",
    headline: "Intelligence for serious traders",
    sub: "Attributed calls · live performance · private research journal",
    bullets: [
      "Publish theses with entry, target, and stop on record",
      "Track posture — building, active, trimming — in your journal",
      "Fueled desk research + member rankings on one chart",
    ],
  },
  join: {
    eyebrow: "PORTFUEL",
    headline: "Join the member workspace",
    sub: "Track calls. Log your book. Build reputation on record.",
    bullets: [
      "Live return % on every published call",
      "Private journal for thesis, levels, and trade posture",
      "Optional X spotlight when your call qualifies",
    ],
  },
  proof: {
    eyebrow: "PORTFUEL · ON RECORD",
    headline: "Calls on record. Returns tracked.",
    sub: "Member and Fueled desk theses with live marks — not anonymous tips.",
    bullets: [
      "Entry, target, and stop on every published call",
      "Public proof only after strict performance gates",
      "Charts generated from real PortFuel data",
    ],
  },
  desk: {
    eyebrow: "PORTFUEL · FUELED DESK",
    headline: "House research + member intelligence",
    sub: "Two lanes: curated desk theses and attributed community calls.",
    bullets: [
      "Fueled model portfolio with live marks",
      "Member rankings and public track records",
      "Same chart language from desk to ticker",
    ],
  },
  demo: {
    eyebrow: "PORTFUEL",
    headline: "Explore the member workspace",
    sub: "Preview feed, desk, and rankings before you join.",
    bullets: [
      "Read-only tour at portfuel.pro/demo",
      "Watchlist journal + call feed in one workspace",
      "Join when you're ready to publish calls",
    ],
  },
};

export const MARKETING_AD_COPY: Record<
  MarketingAdVariant,
  { headline: string; sub: string; cta: string }
> = {
  proof: {
    headline: "Calls on record. Returns tracked.",
    sub: "Member performance on record with live marks — charts from real call data.",
    cta: "Join PortFuel",
  },
  structure: {
    headline: "Publish your thesis. Prove results.",
    sub: "Entry, target, stop, and private posture — building through trimming — on every idea.",
    cta: "Get member access",
  },
  desk: {
    headline: "Fueled desk + member rankings",
    sub: "House research and attributed community calls — one visual language.",
    cta: "Explore the workspace",
  },
};

/** Master prompt for AI background plates — use with Midjourney --sref or Ideogram style reference. */
export const AI_BACKGROUND_PROMPT = `Dark editorial financial SaaS marketing background, deep charcoal #0f1419 base, subtle red accent glow #e31b23 at 8% opacity, minimal abstract grid lines, premium institutional mood, soft gradient mesh, no text, no logos, no people, no stock charts, no coins, no rockets, 16:9, ultra clean, Bloomberg-meets-private-club aesthetic`;

export const AI_NEGATIVE_PROMPT = `text, watermark, logo, meme, neon cyberpunk, gold coins, rocket, lamborghini, crowded chart, trading guru, laser eyes, guaranteed returns, get rich quick, blurry, low quality, clipart`;

export const AI_STYLE_RULES = [
  "Use PortFuel red (#E31B23) sparingly — accents only, never full backgrounds.",
  "Prefer dark charcoal (#0F1419) or white editorial panels matching social charts.",
  "Never generate logos or wordmarks — composite the real logo in Figma or use product PNGs.",
  "Ship performance posts from /api/social/chart/{callId} — not AI art.",
  "For paid ads: programmatic headline card + real chart PNG side-by-side in Figma.",
  "Always include “Not investment advice” on outbound social and ads.",
] as const;

export const FIGMA_CHECKLIST = [
  "Create brand colors: BG #0F1419, Surface #1A2332, Accent #E31B23, Text #94A3B8, Bright #F8FAFC",
  "Install Inter (400, 500, 600, 700) — matches app and OG renders",
  "Frames: 1200×630 (OG), 1200×675 (X), 1080×1080 (square)",
  "Components: Logo lockup, disclaimer bar, CTA button (red fill), chart placeholder 16:9",
  "Template A — Proof ad: chart PNG left 58%, headline + CTA right",
  "Template B — Structure ad: product screenshot in device frame + headline",
  "Template C — Carousel slide: export from Admin → Marketing → Ad cards",
] as const;
