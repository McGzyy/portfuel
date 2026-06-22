import type { CallCardData } from "@/components/calls/CallCard";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";
import type { EarningsCalendarRow } from "@/lib/market/earnings-calendar";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { buildPublishUrlFromHubEntry } from "@/lib/watchlist/journal-call-url";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { formatPct } from "@/lib/utils";
import { journalSymbolPath } from "@/lib/journal/paths";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";
import { buildFeedHref } from "@/lib/dashboard/nav";
import type { ProFollowingHighlight } from "@/lib/pro/following-brief";

export type ProTodayBriefRow = {
  id: string;
  title: string;
  detail: string;
  /** Smaller secondary line — extra context without crowding the headline fact. */
  meta?: string;
  href: string;
  accent?: "desk" | "earnings" | "screener" | "book" | "journal" | "crypto" | "following" | "watchlist";
};

export type ProTodayBrief = {
  deskNote: string | null;
  rows: ProTodayBriefRow[];
};

function fmtShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function hourLabel(hour: string): string {
  const h = hour?.toLowerCase() ?? "";
  if (h === "bmo" || h === "amc") return h.toUpperCase();
  if (h.includes("before")) return "BMO";
  if (h.includes("after")) return "AMC";
  return hour || "";
}

export function buildProTodayBrief(input: {
  deskNote: string | null;
  watchlistEarnings: EarningsCalendarRow[];
  screener: CommunityScreenerData;
  battleboard: EarningsBattleboardSummary;
  openCalls: CallCardData[];
  journalReady: WatchlistEntry[];
  memberProfileHref: string;
  followingHighlights?: ProFollowingHighlight[];
  watchlistItems?: WatchlistEntry[];
}): ProTodayBrief {
  const rows: ProTodayBriefRow[] = [];

  if (input.deskNote?.trim()) {
    const note =
      input.deskNote.trim().length > 120
        ? `${input.deskNote.trim().slice(0, 117)}…`
        : input.deskNote.trim();
    rows.push({
      id: "desk",
      title: "Fueled desk note",
      detail: note,
      meta: "House research · weekly positioning on the desk",
      href: "/dashboard/desk",
      accent: "desk",
    });
  }

  const following = input.followingHighlights ?? [];
  const recentPublishes = following.filter((h) => h.kind === "publish");
  const followingMovers = following.filter((h) => h.kind === "mover");

  if (recentPublishes.length > 0) {
    const lead = recentPublishes[0]!;
    rows.push({
      id: "following",
      title: "Following",
      detail:
        recentPublishes.length === 1
          ? `@${lead.username} published ${lead.symbol} ${lead.direction.toUpperCase()}`
          : `${recentPublishes.length} new theses from people you follow`,
      meta: recentPublishes
        .slice(0, 3)
        .map((h) => `@${h.username} · ${h.symbol}`)
        .join(" · "),
      href: buildFeedHref({ filter: "following" }),
      accent: "following",
    });
  } else if (followingMovers.length > 0) {
    const lead = followingMovers[0]!;
    rows.push({
      id: "following-movers",
      title: "Following movers",
      detail: `${lead.symbol} ${lead.returnPct != null ? formatPct(lead.returnPct) : ""} · @${lead.username}`,
      meta:
        followingMovers.length > 1
          ? `Also: ${followingMovers
              .slice(1)
              .map((h) => `${h.symbol} ${h.returnPct != null ? formatPct(h.returnPct) : ""}`)
              .join(" · ")}`
          : `${lead.direction.toUpperCase()} thesis on your following feed`,
      href: buildFeedHref({ filter: "following", tab: "performing" }),
      accent: "following",
    });
  }

  const watchlistMovers = (input.watchlistItems ?? [])
    .filter((i) => i.change_since_add_pct != null && i.change_since_add_pct !== 0)
    .sort(
      (a, b) =>
        Math.abs(b.change_since_add_pct ?? 0) - Math.abs(a.change_since_add_pct ?? 0)
    )
    .slice(0, 3);

  if (watchlistMovers.length > 0) {
    const lead = watchlistMovers[0]!;
    rows.push({
      id: "watchlist-movers",
      title: "Watchlist movers",
      detail: `${lead.symbol} ${formatPct(lead.change_since_add_pct)} since you added`,
      meta:
        watchlistMovers.length > 1
          ? `Also: ${watchlistMovers
              .slice(1)
              .map((i) => `${i.symbol} ${formatPct(i.change_since_add_pct)}`)
              .join(" · ")}`
          : "Live marks on symbols you're researching",
      href: journalSymbolPath(lead.symbol),
      accent: "watchlist",
    });
  }

  const earnings = input.watchlistEarnings.slice(0, 3);
  if (earnings.length > 0) {
    const next = earnings[0]!;
    rows.push({
      id: "earnings",
      title: "Your watchlist earnings",
      detail:
        earnings.length === 1
          ? `${next.symbol} reports ${fmtShortDate(next.date)}${hourLabel(next.hour) ? ` · ${hourLabel(next.hour)}` : ""}`
          : `${next.symbol} is next · ${fmtShortDate(next.date)}`,
      meta:
        earnings.length === 1
          ? "Only symbol on your list in this window"
          : `${earnings.length} symbols on your watchlist · ${earnings
              .slice(1, 3)
              .map((e) => e.symbol)
              .join(", ")}${earnings.length > 3 ? " + more" : ""} also reporting`,
      href: buildResearchHubHref("earnings"),
      accent: "earnings",
    });
  } else if (input.battleboard.reportingCount > 0) {
    rows.push({
      id: "earnings",
      title: "Earnings calendar",
      detail:
        input.battleboard.nextSymbol && input.battleboard.nextDate
          ? `${input.battleboard.reportingCount} names reporting · focus ${input.battleboard.nextSymbol}`
          : `${input.battleboard.reportingCount} symbols reporting this week`,
      meta:
        input.battleboard.nextSymbol && input.battleboard.nextDate
          ? `Next ${input.battleboard.nextSymbol} ${fmtShortDate(input.battleboard.nextDate)} · ${input.battleboard.withCommunity} with community calls`
          : `${input.battleboard.withCommunity} names already have member theses`,
      href: buildResearchHubHref("earnings"),
      accent: "earnings",
    });
  }

  const screenerRows = input.screener.targetProgress.slice(0, 3);
  if (screenerRows.length > 0) {
    const lead = screenerRows[0]!;
    rows.push({
      id: "screener",
      title: "Screener pulse",
      detail: `${lead.symbol} ${Math.round(lead.target_progress)}% to target${
        lead.return_pct != null ? ` (${formatPct(lead.return_pct)})` : ""
      }`,
      meta:
        screenerRows.length > 1
          ? `Also pacing: ${screenerRows
              .slice(1)
              .map((r) => `${r.symbol} ${Math.round(r.target_progress)}%`)
              .join(" · ")}`
          : `${lead.direction.toUpperCase()} thesis · @${lead.username}`,
      href: buildResearchHubHref("screener"),
      accent: "screener",
    });
  } else if (input.screener.mostCalled[0]) {
    const top = input.screener.mostCalled[0];
    rows.push({
      id: "screener",
      title: "Screener pulse",
      detail: `${top.symbol} · ${top.callCount} community call${top.callCount === 1 ? "" : "s"} this week`,
      meta: `${top.latestDirection.toUpperCase()} bias · best mark ${
        top.bestReturnPct != null ? formatPct(top.bestReturnPct) : "—"
      }`,
      href: buildResearchHubHref("screener"),
      accent: "screener",
    });
  }

  const cryptoReturns = input.screener.topReturns.filter((r) => r.asset_class === "crypto").slice(0, 3);
  if (cryptoReturns.length > 0) {
    const lead = cryptoReturns[0]!;
    rows.push({
      id: "crypto-movers",
      title: "Crypto movers",
      detail: `${lead.symbol} ${formatPct(lead.return_pct)} · @${lead.username}`,
      meta:
        cryptoReturns.length > 1
          ? `Also: ${cryptoReturns
              .slice(1)
              .map((r) => `${r.symbol} ${formatPct(r.return_pct)}`)
              .join(" · ")}`
          : `${lead.direction.toUpperCase()} · 30-day ranked return`,
      href: buildResearchHubHref("screener"),
      accent: "crypto",
    });
  }

  if (input.openCalls.length > 0) {
    const avg =
      input.openCalls.reduce((sum, c) => sum + (c.return_pct ?? 0), 0) /
      input.openCalls.filter((c) => c.return_pct != null).length;
    const top = [...input.openCalls].sort(
      (a, b) => (b.return_pct ?? -999) - (a.return_pct ?? -999)
    )[0]!;
    rows.push({
      id: "positions",
      title: "Your positions",
      detail: `${input.openCalls.length} live call${input.openCalls.length === 1 ? "" : "s"} · best ${top.symbol}${
        top.return_pct != null ? ` ${formatPct(top.return_pct)}` : ""
      }`,
      meta: `${Number.isFinite(avg) ? `Book avg ${formatPct(avg)}` : "Live marks on your open book"} · ${
        input.openCalls.length === 1 ? "1 symbol" : `${new Set(input.openCalls.map((c) => c.symbol)).size} symbols`
      }`,
      href: "/dashboard/book",
      accent: "book",
    });
  }

  for (const item of input.journalReady.slice(0, 2)) {
    rows.push({
      id: `ready-${item.symbol}`,
      title: "Ready to publish",
      detail: `${item.symbol} · research checklist complete`,
      meta: "Thesis drafted on watchlist — one tap to publish on record",
      href: buildPublishUrlFromHubEntry(item),
      accent: "journal",
    });
  }

  if (rows.length === 0) {
    rows.push({
      id: "journal-start",
      title: "Start research",
      detail: "Add a watchlist symbol and draft a thesis to populate your morning brief.",
      href: "/dashboard/watchlist",
      accent: "journal",
    });
  }

  return {
    deskNote: input.deskNote?.trim() || null,
    rows: rows.slice(0, 7),
  };
}

export const DEMO_PRO_TODAY_BRIEF: ProTodayBrief = {
  deskNote:
    "Desk focus: AI capex leaders and selective crypto beta — full theses on the Fueled desk.",
  rows: [
    {
      id: "desk-demo",
      title: "Fueled desk note",
      detail: "Quality over quantity this week — mega-cap AI and BTC ETF flows in focus.",
      href: "/dashboard/desk",
      accent: "desk",
    },
    {
      id: "following-demo",
      title: "Following",
      detail: "2 new theses from people you follow",
      meta: "@alpha · NVDA · @deskflow · AMD",
      href: "/dashboard/feed?filter=following",
      accent: "following",
    },
    {
      id: "watchlist-demo",
      title: "Watchlist movers",
      detail: "TSLA +4.2% since you added",
      meta: "Also: COIN +3.1% · SMCI −2.8%",
      href: "/dashboard/journal/TSLA",
      accent: "watchlist",
    },
    {
      id: "earnings-demo",
      title: "Your watchlist earnings",
      detail: "NVDA reports Thu AMC · 2 more symbols on your list this fortnight",
      href: buildResearchHubHref("earnings"),
      accent: "earnings",
    },
    {
      id: "screener-demo",
      title: "Screener pulse",
      detail: "AMD 68% to target · NVDA 54% · META 41%",
      href: buildResearchHubHref("screener"),
      accent: "screener",
    },
    {
      id: "book-demo",
      title: "Your positions",
      detail: "3 live calls · best NVDA +12.4% · avg +6.2%",
      href: "/dashboard/book",
      accent: "book",
    },
    {
      id: "ready-demo",
      title: "Ready to publish",
      detail: "AMD · research checklist complete",
      href: journalSymbolPath("AMD"),
      accent: "journal",
    },
  ],
};
