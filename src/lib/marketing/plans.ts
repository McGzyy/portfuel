import type { MembershipTier } from "@/lib/stripe/config";

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
  { feature: "In-app + email alerts", member: true, pro: true },
  { feature: "Published calls per week", member: "2", pro: "6" },
  { feature: "News, earnings & SEC on tickers", member: false, pro: true },
  { feature: "Intraday chart (1H / 15m) + SMA / VWAP", member: false, pro: true },
  { feature: "Community screener & CSV export", member: false, pro: true },
  { feature: "Ticker compare (2–3 symbols)", member: false, pro: true },
  { feature: "Watchlist move & earnings alerts", member: false, pro: true },
  { feature: "Return distribution on profile", member: false, pro: true },
  { feature: "Pro feed & rankings analytics strips", member: false, pro: true },
  { feature: "AI thesis coach (educational)", member: "2/mo", pro: "30/mo" },
  { feature: "One-line thesis summaries on calls", member: "Read cache", pro: "Generate" },
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
      "2 AI thesis coach reviews · read cached quick summaries",
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
      "30 AI thesis coach reviews + track-record context",
      "Generate one-line thesis summaries (60/mo)",
    ],
  },
};

export const PLAN_ORDER: MembershipTier[] = ["member", "pro"];

export function formatTierColumnHeader(tier: MembershipTier): string {
  const plan = PLAN_BY_TIER[tier];
  const label = tier === "member" ? "Member" : "Pro";
  return `${label} ${plan.price}`;
}

export function formatTierPrice(tier: MembershipTier): string {
  const plan = PLAN_BY_TIER[tier];
  return `${plan.price}${plan.period}`;
}

export function formatTierPriceLong(tier: MembershipTier): string {
  const plan = PLAN_BY_TIER[tier];
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
      "Screener, multi-symbol compare, CSV export, watchlist move alerts, and analytics strips on feed and rankings.",
  },
] as const;

/** Profile / upgrade card — aligns with TIER_COMPARISON_ROWS but readable as bullets. */
export const PRO_VALUE_BULLETS = [
  "AI thesis coach — 30 reviews/mo with your track record in context",
  "One-line thesis summaries on any call (generate 60/mo; Members read cached)",
  "News, earnings & SEC filings on every equity ticker",
  "Intraday chart (1H / 15m) with SMA and VWAP overlays",
  "Pro feed & rankings analytics (target progress, win-rate depth)",
  "6 published calls per week (vs 2 on Member)",
  "Watchlist move alerts (±5% since you added a symbol)",
  "Earnings calendar for your watchlist (next 14 days)",
  "Community screener — most called symbols & best 30-day returns (CSV export)",
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
