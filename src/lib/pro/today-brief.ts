import type { CallCardData } from "@/components/calls/CallCard";
import type { EarningsBattleboardSummary } from "@/lib/earnings/battleboard";
import type { EarningsCalendarRow } from "@/lib/market/earnings-calendar";
import type { CommunityScreenerData } from "@/lib/screener/community";
import { buildPublishUrlFromHubEntry } from "@/lib/watchlist/journal-call-url";
import type { WatchlistEntry } from "@/lib/watchlist/types";
import { formatPct } from "@/lib/utils";
import { journalSymbolPath } from "@/lib/journal/paths";
import { buildResearchHubHref } from "@/lib/dashboard/research-hub";

export type ProTodayBriefRow = {
  id: string;
  title: string;
  detail: string;
  href: string;
  accent?: "desk" | "earnings" | "screener" | "book" | "journal" | "crypto";
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
      href: "/dashboard/desk",
      accent: "desk",
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
          : `${earnings.length} symbols this fortnight · next ${next.symbol} ${fmtShortDate(next.date)}`,
      href: buildResearchHubHref("earnings"),
      accent: "earnings",
    });
  } else if (input.battleboard.reportingCount > 0) {
    rows.push({
      id: "earnings",
      title: "Earnings calendar",
      detail:
        input.battleboard.nextSymbol && input.battleboard.nextDate
          ? `${input.battleboard.reportingCount} names reporting · community focus on ${input.battleboard.nextSymbol}`
          : `${input.battleboard.reportingCount} symbols reporting this week`,
      href: buildResearchHubHref("earnings"),
      accent: "earnings",
    });
  }

  const screenerRows = input.screener.targetProgress.slice(0, 3);
  if (screenerRows.length > 0) {
    rows.push({
      id: "screener",
      title: "Screener pulse",
      detail: screenerRows
        .map(
          (r) =>
            `${r.symbol} ${Math.round(r.target_progress)}% to target${
              r.return_pct != null ? ` (${formatPct(r.return_pct)})` : ""
            }`
        )
        .join(" · "),
      href: buildResearchHubHref("screener"),
      accent: "screener",
    });
  } else if (input.screener.mostCalled[0]) {
    const top = input.screener.mostCalled[0];
    rows.push({
      id: "screener",
      title: "Screener pulse",
      detail: `${top.symbol} · ${top.callCount} community call${top.callCount === 1 ? "" : "s"} this week`,
      href: buildResearchHubHref("screener"),
      accent: "screener",
    });
  }

  const cryptoReturns = input.screener.topReturns.filter((r) => r.asset_class === "crypto").slice(0, 3);
  if (cryptoReturns.length > 0) {
    rows.push({
      id: "crypto-movers",
      title: "Crypto movers",
      detail: cryptoReturns
        .map((r) => `${r.symbol} ${formatPct(r.return_pct)} · @${r.username}`)
        .join(" · "),
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
      id: "open-book",
      title: "Your open book",
      detail: `${input.openCalls.length} live call${input.openCalls.length === 1 ? "" : "s"} · best ${top.symbol}${
        top.return_pct != null ? ` ${formatPct(top.return_pct)}` : ""
      }${Number.isFinite(avg) ? ` · avg ${formatPct(avg)}` : ""}`,
      href: "/dashboard/book",
      accent: "book",
    });
  }

  for (const item of input.journalReady.slice(0, 2)) {
    rows.push({
      id: `ready-${item.symbol}`,
      title: "Ready to publish",
      detail: `${item.symbol} · research checklist complete`,
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
    rows: rows.slice(0, 6),
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
      title: "Your open book",
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
