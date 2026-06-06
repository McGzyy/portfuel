import type { BillingInterval, MembershipTier } from "@/lib/stripe/config";

export type TierComparisonRow = {
  feature: string;
  member: boolean | string;
  pro: boolean | string;
};

/** Single source of truth for Member vs Pro comparison (landing, /join, profile). */
export const TIER_COMPARISON_ROWS: TierComparisonRow[] = [
  { feature: "Member feed, votes & comments", member: true, pro: true },
  { feature: "Direct messages (1:1)", member: true, pro: true },
  { feature: "Ticker charts with call markers", member: true, pro: true },
  { feature: "Watchlist, rankings & follow callers", member: true, pro: true },
  { feature: "Fueled desk + model portfolio (live marks)", member: true, pro: true },
  { feature: "Onboarding watchlist + workspace tour", member: true, pro: true },
  { feature: "In-app + email watchlist alerts", member: true, pro: true },
  { feature: "SMS text watchlist alerts", member: false, pro: true },
  { feature: "Published calls per week", member: "2", pro: "6" },
  { feature: "News, earnings & SEC on tickers", member: false, pro: true },
  { feature: "Intraday chart (1H / 15m) + SMA / VWAP", member: false, pro: true },
  { feature: "Community screener & CSV export", member: false, pro: true },
  { feature: "Earnings — reporting week + positioning", member: false, pro: true },
  { feature: "Shareable track record card", member: true, pro: true },
  { feature: "Ticker compare (2–3 symbols)", member: false, pro: true },
  { feature: "Watchlist price, earnings & plan-level alerts", member: true, pro: true },
  { feature: "Return distribution on profile", member: false, pro: true },
  { feature: "Pro feed & rankings analytics strips", member: false, pro: true },
  { feature: "AI thesis coach (educational — feedback on your draft)", member: "2/mo", pro: "30/mo" },
  { feature: "AI call summaries (one line for skimming)", member: "Read cached", pro: "Generate 60/mo" },
  { feature: "AI journal context on watchlist alerts", member: "15/mo", pro: "75/mo" },
  { feature: "AI journal research assistant (thesis gaps & catalyst checks)", member: "12/mo", pro: "60/mo" },
  { feature: "AI Assist (generate a draft call from ticker + notes)", member: false, pro: "10/day + 3 Deepen+/day" },
];

export type PlanCardContent = {
  name: string;
  price: string;
  period: string;
  priceAmount: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

export const PLAN_BY_TIER: Record<MembershipTier, PlanCardContent> = {
  member: {
    name: "Member",
    price: "$79",
    period: "/mo",
    priceAmount: 79,
    tagline: "The full PortFuel workspace — desk, feed, charts, DMs, and a public track record.",
    features: [
      "Fueled desk + model portfolio with live marks",
      "Member feed, DMs, watchlist & rankings",
      "2 published calls per week",
      "Ticker charts with entry / target / stop lines",
      "AI thesis coach (educational): 2 reviews/mo",
      "AI call summaries: read cached quick reads",
      "Watchlist alerts: price moves, earnings & plan levels (in-app + email)",
      "AI journal context on alerts: 15/mo",
      "AI journal research assistant: 12 reviews/mo",
    ],
  },
  pro: {
    name: "Pro Intelligence",
    price: "$129",
    period: "/mo",
    priceAmount: 129,
    tagline: "Everything in Member plus the research terminal — intel, screeners, and Pro analytics.",
    highlight: true,
    features: [
      "Everything in Member",
      "6 calls/week · news, earnings & SEC",
      "Intraday chart, SMA / VWAP & ticker compare",
      "Screener, CSV export & Pro analytics strips",
      "AI thesis coach (educational): 30 reviews/mo + track-record context",
      "AI call summaries: generate 60/mo",
      "AI Assist: generate draft calls from ticker + notes (10/day + 3 Deepen+/day)",
      "SMS text alerts for watchlist (price, earnings, plan levels)",
      "AI journal context on alerts: 75/mo",
      "AI journal research assistant: 60 reviews/mo",
    ],
  },
};

export const PLAN_ORDER: MembershipTier[] = ["member", "pro"];

/** Display-only annual pricing (must match Stripe annual Price amounts). */
export const ANNUAL_PLAN_BY_TIER: Record<
  MembershipTier,
  { price: string; period: string; priceAmount: number; savingsNote: string }
> = {
  member: {
    price: "$790",
    period: "/yr",
    priceAmount: 790,
    savingsNote: "Save ~$158 vs paying monthly",
  },
  pro: {
    price: "$1,290",
    period: "/yr",
    priceAmount: 1290,
    savingsNote: "Save ~$258 vs paying monthly",
  },
};

export function planPricingForInterval(tier: MembershipTier, interval: BillingInterval) {
  const base = PLAN_BY_TIER[tier];
  if (interval === "annual") {
    const annual = ANNUAL_PLAN_BY_TIER[tier];
    return {
      ...base,
      price: annual.price,
      period: annual.period,
      priceAmount: annual.priceAmount,
    };
  }
  return base;
}

export function formatTierPriceForInterval(
  tier: MembershipTier,
  interval: BillingInterval
): string {
  const plan = planPricingForInterval(tier, interval);
  return `${plan.price}${plan.period}`;
}

export function formatTierColumnHeader(tier: MembershipTier): string {
  const plan = PLAN_BY_TIER[tier];
  const label = tier === "member" ? "Member" : "Pro";
  return `${label} ${plan.price}`;
}

export function formatTierPrice(tier: MembershipTier): string {
  const plan = PLAN_BY_TIER[tier];
  return `${plan.price}${plan.period}`;
}

export function formatTierPriceLong(
  tier: MembershipTier,
  interval: BillingInterval = "monthly"
): string {
  const plan = planPricingForInterval(tier, interval);
  return `${plan.name} — ${plan.price}${plan.period}`;
}

export const MARKETING_PRICE_SUMMARY = `Member from ${formatTierPrice("member")} · Pro Intelligence ${formatTierPrice("pro")}`;

export function formatProIntelligenceLabel(): string {
  return `Pro Intelligence (${formatTierPrice("pro")})`;
}

export function formatProUpgradeCta(): string {
  return `Upgrade to Pro — ${formatTierPrice("pro")}`;
}

/** Locked behind membership — shown on landing “member wall” section. */
export const MEMBER_WALL_FEATURES = [
  "Live member feed with new-since-visit badges",
  "Full theses with entry, target & stop",
  "Ticker charts with community call markers",
  "Votes, comments & direct messages",
  "Fueled desk + model portfolio (live marks)",
  "Watchlist, rankings & your track record",
] as const;

export const LANDING_STAT_TILES = [
  { label: "Ticker intel", value: "Charts + theses" },
  { label: "Fueled desk", value: "House portfolio" },
  { label: "Rankings", value: "Live scores" },
] as const;

export const LANDING_PRODUCT_PILLARS = [
  {
    title: "Member feed & track record",
    description:
      "Latest and top-performing calls with votes, comments, new-since-visit badges, and a profile that builds as you publish.",
  },
  {
    title: "Ticker intelligence",
    description:
      "Charts with entry, target, and stop lines, community theses, hype, and — on Pro — news, earnings, SEC, and intraday overlays.",
  },
  {
    title: "Fueled desk",
    description:
      "Weekly house note and model portfolio with live marks — curated research without hunting Twitter.",
  },
  {
    title: "Research terminal (Pro)",
    description:
      "Screener, multi-symbol compare, CSV export, SMS watchlist alerts, and analytics strips on feed and rankings.",
  },
] as const;

/** Profile / upgrade card — aligns with TIER_COMPARISON_ROWS but readable as bullets. */
export const PRO_VALUE_BULLETS = [
  "AI thesis coach — 30 reviews/mo with your track record in context",
  "One-line thesis summaries on any call (generate 60/mo; Members read cached)",
  "AI Assist — generate Fueled-style call drafts from just a ticker (10/day + 3 Deepen+/day)",
  "News, earnings & SEC filings on every equity ticker",
  "Intraday chart (1H / 15m) with SMA and VWAP overlays",
  "Pro feed & rankings analytics (target progress, win-rate depth)",
  "6 published calls per week (vs 2 on Member)",
  "SMS text watchlist alerts (price, earnings, plan levels)",
  "Watchlist alerts with AI journal context (75/mo)",
  "AI journal research assistant — thesis gaps & catalyst checks (60/mo)",
  "Earnings calendar for your watchlist (next 14 days)",
  "Community screener — conviction, target progress, desk vs crowd (CSV export)",
  "Earnings — reporting week with community positioning",
  "Ticker compare — 2–3 symbols on one normalized chart",
  "Return distribution on your profile track record",
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Join & onboard",
    text: "Pick Member or Pro, create your account, seed your watchlist, and take a quick tour of feed, desk, and rankings.",
  },
  {
    title: "Publish & track calls",
    text: "Post stock or crypto theses with targets. Prices refresh, returns update, and your rank score builds automatically.",
  },
  {
    title: "Research & engage",
    text: "Follow trusted callers, use ticker intel and the desk portfolio, and upgrade to Pro when you want the full research stack.",
  },
] as const;
