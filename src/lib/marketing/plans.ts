import type { MembershipTier } from "@/lib/stripe/config";

export type TierComparisonRow = {
  feature: string;
  member: boolean | string;
  pro: boolean | string;
};

export const TIER_COMPARISON_ROWS: TierComparisonRow[] = [
  { feature: "Member feed, votes & comments", member: true, pro: true },
  { feature: "Ticker charts with call markers", member: true, pro: true },
  { feature: "Watchlist & follow top callers", member: true, pro: true },
  { feature: "Fueled desk + model portfolio (live marks)", member: true, pro: true },
  { feature: "In-app + email alerts", member: true, pro: true },
  { feature: "Published calls per week", member: "2", pro: "6" },
  { feature: "News, earnings & SEC on tickers", member: false, pro: true },
  { feature: "Community screener & CSV export", member: false, pro: true },
  { feature: "Ticker compare (2–3 symbols)", member: false, pro: true },
  { feature: "Watchlist move & earnings alerts", member: false, pro: true },
  { feature: "Return distribution on profile", member: false, pro: true },
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
    tagline: "The full PortFuel workspace — desk model portfolio, feed, and track record.",
    features: [
      "Fueled desk + model portfolio with live marks",
      "2 published calls per week",
      "Watchlist, follow members & alerts",
      "Ticker charts, rankings & track record",
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
      "Screener, ticker compare & CSV export",
      "Watchlist move alerts & earnings calendar",
      "30 AI thesis coach reviews + track-record context",
      "Generate one-line thesis summaries on feed & ticker (60/mo)",
    ],
  },
};

export const PLAN_ORDER: MembershipTier[] = ["member", "pro"];
