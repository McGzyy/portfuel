import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { assertCanPublishCalls, moderationErrorResponse } from "@/lib/auth/moderation-guards";
import { requireActiveMember } from "@/lib/auth/session";
import { getQuote, getCryptoLastPrice } from "@/lib/market/finnhub";
import { fetchCallsFeed, refreshQuotesAndScores } from "@/lib/calls/service";
import {
  computeReturnPct,
  computeScorePoints,
  computeTargetProgress,
} from "@/lib/scoring/returns";
import {
  notifyFollowedMemberNewCall,
  notifyWatchlistNewCall,
} from "@/lib/notifications/service";
import { validateSymbol } from "@/lib/market/validate-symbol";
import { notifyDiscordNewCall } from "@/lib/discord/events";
import {
  attachCachedResearchSnapshotToCall,
  attachSocialResearchSnapshotToCall,
} from "@/lib/calls/research-snapshot";

const createSchema = z.object({
  symbol: z.string().min(1).max(12),
  assetClass: z.enum(["equity", "crypto"]).default("equity"),
  direction: z.enum(["long", "short"]),
  thesis: z.string().min(10).max(5000),
  entryPrice: z.number().positive().optional(),
  targetPrice: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  timeframeTag: z.string().max(32).optional(),
  isFueled: z.boolean().optional(),
  sourceTweetUrl: z.string().url().max(500).optional(),
  socialAnalysisMode: z.enum(["default", "deep"]).optional(),
  socialAnalysisRawText: z.string().min(12).max(8000).optional(),
});

export async function GET(request: Request) {
  try {
    const mode = new URL(request.url).searchParams.get("mode") ?? "latest";
    if (mode !== "latest" && mode !== "performing") {
      return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
    }
    const calls = await fetchCallsFeed(mode);
    return NextResponse.json({ calls });
  } catch (e) {
    console.error("[calls GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    assertCanPublishCalls(session);
    const body = createSchema.parse(await request.json());
    const symbol = body.symbol.toUpperCase().trim();

    const db = createServiceClient();

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count } = await db
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .gte("called_at", weekAgo);

    const { data: userRow } = await db
      .from("users")
      .select("submission_quota_week, calls_count")
      .eq("id", session.userId)
      .single();

    const quota = userRow?.submission_quota_week ?? 2;
    if ((count ?? 0) >= quota) {
      return NextResponse.json({ error: "quota_exceeded", quota }, { status: 403 });
    }

    const validated = await validateSymbol(symbol, body.assetClass);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const resolvedSymbol = validated.symbol;
    let priceAtCall = body.entryPrice ?? null;
    if (priceAtCall == null) {
      if (body.assetClass === "crypto" && validated.finnhubSymbol) {
        priceAtCall = (await getCryptoLastPrice(validated.finnhubSymbol)) ?? null;
      } else {
        const quote = await getQuote(resolvedSymbol);
        priceAtCall = quote?.c ?? null;
      }
    }

    await db.from("ticker_snapshots").upsert({
      symbol: resolvedSymbol,
      company_name: validated.name ?? resolvedSymbol,
      last_price: priceAtCall,
      asset_class: body.assetClass,
      finnhub_symbol: validated.finnhubSymbol ?? null,
      updated_at: new Date().toISOString(),
    } as never);

    const isFueled = body.isFueled === true && session.role === "admin";
    const sourceTweetUrl =
      session.role === "admin" && body.sourceTweetUrl?.trim()
        ? body.sourceTweetUrl.trim()
        : null;
    const socialRawText =
      session.role === "admin" && body.socialAnalysisRawText?.trim()
        ? body.socialAnalysisRawText.trim()
        : null;

    const basis = body.entryPrice ?? priceAtCall;
    const returnPct =
      basis != null && priceAtCall != null
        ? computeReturnPct({
            direction: body.direction,
            basisPrice: Number(basis),
            lastPrice: priceAtCall,
          })
        : null;
    let targetProgress: number | null = null;
    if (body.entryPrice && body.targetPrice && priceAtCall != null) {
      targetProgress = computeTargetProgress({
        direction: body.direction,
        entry: body.entryPrice,
        target: body.targetPrice,
        lastPrice: priceAtCall,
      });
    }
    const scorePoints = computeScorePoints({
      returnPct,
      voteScore: 0,
      ageDays: 0,
    });

    const { data: call, error } = await db
      .from("calls")
      .insert({
        user_id: session.userId,
        symbol: resolvedSymbol,
        asset_class: body.assetClass,
        direction: body.direction,
        thesis: body.thesis.trim(),
        entry_price: body.entryPrice ?? null,
        target_price: body.targetPrice ?? null,
        stop_price: body.stopPrice ?? null,
        timeframe_tag: body.timeframeTag ?? null,
        price_at_call: priceAtCall,
        last_price: priceAtCall,
        return_pct: returnPct,
        target_progress: targetProgress,
        score_points: scorePoints,
        is_fueled: isFueled,
        source_tweet_url: sourceTweetUrl,
      } as never)
      .select("id, symbol")
      .single();

    if (error) {
      console.error("[calls POST]", error);
      return NextResponse.json({ error: "create_failed" }, { status: 500 });
    }

    if (isFueled && sourceTweetUrl) {
      void attachSocialResearchSnapshotToCall({
        callId: call.id,
        symbol: resolvedSymbol,
        mode: body.socialAnalysisMode ?? "default",
        tweetUrl: sourceTweetUrl,
      });
    } else if (isFueled && socialRawText) {
      void attachCachedResearchSnapshotToCall({
        callId: call.id,
        symbol: resolvedSymbol,
        mode: body.socialAnalysisMode ?? "default",
        source: "ticker_ai",
        rawText: socialRawText,
      });
    }

    await db
      .from("users")
      .update({ calls_count: (userRow?.calls_count ?? 0) + 1 } as never)
      .eq("id", session.userId);

    void notifyWatchlistNewCall({
      callId: call.id,
      symbol: call.symbol,
      callerUserId: session.userId,
      callerUsername: session.username,
      callerDisplayName: session.displayName,
      direction: body.direction,
    });

    void notifyFollowedMemberNewCall({
      callId: call.id,
      symbol: call.symbol,
      callerUserId: session.userId,
      callerUsername: session.username,
      callerDisplayName: session.displayName,
      direction: body.direction,
    });

    void notifyDiscordNewCall({
      callId: call.id,
      symbol: call.symbol,
      direction: body.direction,
      isFueled,
      displayName: session.displayName,
      username: session.username,
    }).catch((e) => console.error("[discord/new-call]", e));

    void refreshQuotesAndScores().catch((e) =>
      console.error("[calls POST refresh-quotes]", e)
    );

    return NextResponse.json({ ok: true, call });
  } catch (e) {
    const mod = moderationErrorResponse(e);
    if (mod) return NextResponse.json({ error: mod.error }, { status: mod.status });
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[calls POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
