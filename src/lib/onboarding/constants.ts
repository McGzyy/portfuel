import type { LucideIcon } from "lucide-react";
import { Compass, NotebookPen, PenLine, Star, TrendingUp, Trophy } from "lucide-react";
import { COPY } from "@/lib/copy";

export const ONBOARDING_DEFAULT_SYMBOLS = [
  "NVDA",
  "AAPL",
  "TSLA",
  "MSFT",
  "META",
  "BTC",
] as const;

export const ONBOARDING_MIN_SYMBOLS = 1;
export const ONBOARDING_MAX_SYMBOLS = 5;

export type OnboardingTourStep = {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
};

export const ONBOARDING_TOUR_STEPS: OnboardingTourStep[] = [
  {
    icon: TrendingUp,
    title: "Member feed",
    body: "Latest and top-performing calls — look for New badges on calls published since your last visit.",
    href: "/dashboard/feed",
  },
  {
    icon: Star,
    title: "Watchlist",
    body: "Track symbols for price, earnings, and plan-level alerts — each symbol gets a private journal.",
    href: "/dashboard/watchlist",
  },
  {
    icon: NotebookPen,
    title: "Research journal",
    body: "Draft thesis, log updates, run AI research, then publish a call when your checklist is complete.",
    href: "/dashboard/journal",
  },
  {
    icon: Compass,
    title: "Fueled desk",
    body: "House model portfolio and weekly desk note — curated research without hunting Twitter.",
    href: "/dashboard/desk",
  },
  {
    icon: Trophy,
    title: "Rankings",
    body: "Leaderboard by rank score — follow trusted members and see how the Trusted badge works.",
    href: "/dashboard/rankings",
  },
  {
    icon: PenLine,
    title: COPY.publishCallCta,
    body: "Publish your thesis with entry, target, and stop. Your track record builds on your profile.",
    href: COPY.newCallHref,
  },
];
