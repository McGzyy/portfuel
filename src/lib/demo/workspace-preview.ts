import { fetchCallsFeed, refreshQuotesForSymbols } from "@/lib/calls/service";
import { fetchLeaderboard } from "@/lib/calls/leaderboard";
import { fetchDeskBrief, type DeskBrief } from "@/lib/desk/brief";
import {
  fetchDeskPortfolio,
  type DeskPortfolioView,
} from "@/lib/desk/portfolio";
import { fetchFueledTrackRecord, type FueledTrackRecord } from "@/lib/fueled/track-record";
import { hasSupabaseConfig } from "@/lib/db/supabase";
import type { CallWithUser } from "@/lib/db/supabase";
import {
  getDemoCallsFeed,
  getDemoLeaderboard,
} from "@/lib/demo/fixtures";
import { mapCallForCard } from "@/lib/dashboard/data";
import type { CallCardData } from "@/components/calls/CallCard";
import { fetchHypeScoresBySymbols } from "@/lib/calls/hype";

export type PreviewDataSource = "live" | "sample";

function summarizeFueled(calls: CallWithUser[]): FueledTrackRecord {
  const fueled = calls.filter((c) => c.is_fueled);
  const withReturn = fueled.filter((c) => c.return_pct != null);
  const wins = withReturn.filter((c) => (c.return_pct ?? 0) > 0).length;
  const avg =
    withReturn.length > 0
      ? withReturn.reduce((s, c) => s + (c.return_pct ?? 0), 0) / withReturn.length
      : null;
  const best = withReturn.reduce<{ symbol: string; return_pct: number } | null>((acc, c) => {
    if (c.return_pct == null) return acc;
    if (!acc || c.return_pct > acc.return_pct) {
      return { symbol: c.symbol, return_pct: c.return_pct };
    }
    return acc;
  }, null);

  return {
    totalCalls: fueled.length,
    openCalls: fueled.length,
    closedCalls: 0,
    avgReturnPct: avg,
    winRate: withReturn.length > 0 ? (wins / withReturn.length) * 100 : null,
    openAvgReturnPct: avg,
    bestSymbol: best?.symbol ?? null,
    bestReturnPct: best?.return_pct ?? null,
    recent: fueled.slice(0, 5).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      direction: c.direction as "long" | "short",
      return_pct: c.return_pct,
      called_at: c.called_at,
      closed_at: c.closed_at ?? null,
    })),
  };
}

function buildSampleDeskBrief(calls: CallWithUser[]): DeskBrief {
  const fueled = calls.filter((c) => c.is_fueled);
  const pinned = fueled[0] ? mapCallForCard(fueled[0]) : null;
  return {
    weeklyNote:
      "Desk focus this week: quality over quantity. We're tracking mega-cap AI leaders and selective crypto beta — full theses on the Fueled desk.",
    pinnedCall: pinned,
    updatedAt: new Date().toISOString(),
  };
}

function buildSampleDeskPortfolio(calls: CallWithUser[]): DeskPortfolioView[] {
  return calls
    .filter((c) => c.is_fueled)
    .slice(0, 4)
    .map((c, i) => ({
      id: `preview-${c.id}`,
      asset_class: (c.asset_class ?? "equity") as "equity" | "crypto",
      symbol: c.symbol,
      direction: c.direction as "long" | "short",
      conviction: 4 - (i % 2),
      horizon_tag: c.timeframe_tag,
      thesis: c.thesis,
      entry_price: c.entry_price,
      target_price: c.target_price,
      stop_price: c.stop_price,
      status: "open" as const,
      opened_at: c.called_at,
      closed_at: null,
      updated_at: c.called_at,
      last_price: c.last_price,
      return_pct: c.return_pct,
    }));
}

async function loadRawFeed(mode: "latest" | "performing"): Promise<CallWithUser[]> {
  if (!hasSupabaseConfig()) return [];
  try {
    let calls = await fetchCallsFeed(mode);
    const symbols = [...new Set(calls.map((c) => c.symbol.toUpperCase()))];
    if (symbols.length > 0) {
      try {
        await refreshQuotesForSymbols(symbols);
        calls = await fetchCallsFeed(mode);
      } catch (e) {
        console.error("[preview/refresh quotes]", e);
      }
    }
    return calls;
  } catch (e) {
    console.error("[preview/feed]", e);
    return [];
  }
}

export async function loadPreviewFeedCalls(
  mode: "latest" | "performing" = "latest"
): Promise<{ calls: CallWithUser[]; source: PreviewDataSource }> {
  const live = await loadRawFeed(mode);
  if (live.length > 0) return { calls: live, source: "live" };
  return { calls: getDemoCallsFeed(mode), source: "sample" };
}

export async function loadPreviewLeaderboard(limit = 30): Promise<{
  rows: Awaited<ReturnType<typeof fetchLeaderboard>>;
  source: PreviewDataSource;
}> {
  if (hasSupabaseConfig()) {
    try {
      const rows = await fetchLeaderboard(limit);
      if (rows.length > 0) return { rows, source: "live" };
    } catch (e) {
      console.error("[preview/leaderboard]", e);
    }
  }
  return {
    rows: getDemoLeaderboard(limit).map((row) => ({ ...row, founding: false })),
    source: "sample",
  };
}

export async function loadPreviewDeskBrief(): Promise<{
  brief: DeskBrief;
  source: PreviewDataSource;
}> {
  if (hasSupabaseConfig()) {
    try {
      const brief = await fetchDeskBrief();
      if (brief.weeklyNote || brief.pinnedCall) {
        return { brief, source: "live" };
      }
    } catch (e) {
      console.error("[preview/desk-brief]", e);
    }
  }
  const { calls } = await loadPreviewFeedCalls("latest");
  return { brief: buildSampleDeskBrief(calls), source: "sample" };
}

export async function loadPreviewDeskPortfolio(): Promise<{
  portfolio: DeskPortfolioView[];
  source: PreviewDataSource;
}> {
  if (hasSupabaseConfig()) {
    try {
      const portfolio = await fetchDeskPortfolio();
      if (portfolio.length > 0) return { portfolio, source: "live" };
    } catch (e) {
      console.error("[preview/desk-portfolio]", e);
    }
  }
  const { calls } = await loadPreviewFeedCalls("latest");
  return { portfolio: buildSampleDeskPortfolio(calls), source: "sample" };
}

export async function loadPreviewFueledTrackRecord(): Promise<{
  record: FueledTrackRecord;
  source: PreviewDataSource;
}> {
  if (hasSupabaseConfig()) {
    try {
      const record = await fetchFueledTrackRecord();
      if (record.totalCalls > 0) return { record, source: "live" };
    } catch (e) {
      console.error("[preview/fueled-track-record]", e);
    }
  }
  const { calls } = await loadPreviewFeedCalls("latest");
  return { record: summarizeFueled(calls), source: "sample" };
}

export async function mapPreviewCallsForCards(
  calls: CallWithUser[]
): Promise<CallCardData[]> {
  const hypeScores = await fetchHypeScoresBySymbols(calls.map((c) => c.symbol));
  return calls.map((c) => mapCallForCard(c, hypeScores));
}
