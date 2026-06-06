import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { runJournalResearchReview } from "@/lib/ai/journal-research";
import { fetchJournalResearchUsage } from "@/lib/ai/journal-research-usage";
import { isAiCoachConfigured } from "@/lib/ai/config";
import {
  formatAiResearchJournalBody,
  researchToSnapshot,
} from "@/lib/journal/research-entry";
import { addJournalEntry, fetchJournalEntries, fetchWatchlistJournal } from "@/lib/watchlist/journal";

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

    const [journal, entries] = await Promise.all([
      fetchWatchlistJournal(session.userId, symbol),
      fetchJournalEntries(session.userId, symbol),
    ]);

    if (!journal) {
      return NextResponse.json({ error: "not_on_watchlist" }, { status: 404 });
    }

    const recent_entries = entries
      .filter((e) => e.entry_type !== "ai_research" && e.entry_type !== "system")
      .slice(-5)
      .map((e) => e.body)
      .reverse();

    const result = await runJournalResearchReview({
      userId: session.userId,
      membershipTier: session.membershipTier ?? null,
      role: session.role,
      input: {
        symbol: journal.symbol,
        thesis: journal.thesis ?? null,
        conviction: journal.conviction ?? null,
        catalysts: journal.catalysts ?? [],
        risk_factors: journal.risk_factors ?? null,
        entry_price: journal.entry_price ?? null,
        stop_price: journal.stop_price ?? null,
        target_price: journal.target_price ?? null,
        bull_case_price: journal.bull_case_price ?? null,
        base_case_price: journal.base_case_price ?? null,
        bear_case_price: journal.bear_case_price ?? null,
        outcome: journal.outcome ?? null,
        recent_entries,
      },
      usageBefore: {
        used: usage.used,
        limit: usage.limit,
        periodMonth: usage.periodMonth,
      },
    });

    const snapshot = researchToSnapshot(result);
    const saved = await addJournalEntry(session.userId, symbol, {
      body: formatAiResearchJournalBody(snapshot),
      entry_type: "ai_research",
      metadata: snapshot,
    });

    if ("error" in saved) {
      console.error("[journal research/save-entry]", saved.error);
    }

    return NextResponse.json({
      ...result,
      entry: "error" in saved ? null : saved.entry,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "ai_empty_response") {
      return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    }
    console.error("[journal research POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
