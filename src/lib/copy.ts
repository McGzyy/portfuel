/**
 * Shared marketing language.
 * Primary signup CTA follows common trading/community apps (TradingView “Get started”, Stocktwits “Join”).
 */
export const COPY = {
  ctaGetAccess: "Join PortFuel",
  ctaSignIn: "Sign in",
  membersOnly: "Members only",
  memberFeed: "Member feed",
  /** Nav / header CTA — community call publish flow */
  newCall: "New call",
  newCallHref: "/calls/new",
  /** Watchlist row when a new community call landed on a symbol */
  watchlistNewCall: "New call",
  /** Publish form submit + empty states */
  publishCall: "Publish call",
  publishCallCta: "Publish a call",
  publishCallsHint: "Publish calls and build your track record.",
  publishingCall: "Publishing…",
  /** Private watchlist journal — not a community call */
  journalAddEntry: "Add entry",
  journalAddingEntry: "Adding…",
  journalSavePlan: "Save journal",
  journalSavingPlan: "Saving…",
  journalAddSymbol: "Add symbol",
  /** Bridge from private journal → community publish */
  publishFromJournal: "Publish call",
} as const;
