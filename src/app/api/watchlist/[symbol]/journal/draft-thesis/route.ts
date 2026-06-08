import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { runJournalThesisDraft } from "@/lib/ai/journal-thesis-draft";
import { fetchJournalResearchUsage } from "@/lib/ai/journal-research-usage";
import { isAiCoachConfigured } from "@/lib/ai/config";
import { fetchJournalDraftMarketContext } from "@/lib/market/draft-context";
import { fetchWatchlistJournal } from "@/lib/watchlist/journal";

export const maxDuration = 60;

type RouteContext = { params: Promise<{ symbol: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireActiveMember();
    const { symbol: raw } = await context.params;
    const symbol = raw.toUpperCase();

    if (!isAiCoachConfigured()) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }

    const usage = await fetchJournalResearchUsage({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      configured: true,
    });

    if (usage.remaining <= 0) {
      return NextResponse.json(
        {
          error: "quota_exceeded",
          usage: { used: usage.used, limit: usage.limit, remaining: 0, periodMonth: usage.periodMonth },
        },
        { status: 429 }
      );
    }

    const journal = await fetchWatchlistJournal(session.userId, symbol);
    if (!journal) {
      return NextResponse.json({ error: "not_on_watchlist" }, { status: 404 });
    }

    const market = await fetchJournalDraftMarketContext(
      symbol,
      journal.asset_class,
      journal.last_price ?? null
    );

    const result = await runJournalThesisDraft({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      symbol: journal.symbol,
      assetClass: journal.asset_class,
      companyName: market.companyName,
      lastPrice: market.lastPrice,
      changePct: market.changePct,
      usageBefore: {
        used: usage.used,
        limit: usage.limit,
        periodMonth: usage.periodMonth,
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (
      e instanceof Error &&
      (e.message === "ai_empty_response" || e.message === "ai_generation_failed")
    ) {
      return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    }
    console.error("[journal draft-thesis POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
