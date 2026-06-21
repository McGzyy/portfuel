import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { assertCanPublishCalls, moderationErrorResponse } from "@/lib/auth/moderation-guards";
import { requireActiveMember } from "@/lib/auth/session";
import { getQuote, getCryptoLastPrice } from "@/lib/market/finnhub";
import { fetchCallsFeed, refreshQuotesForSymbols } from "@/lib/calls/service";
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
import { markWatchlistActiveOnPublish } from "@/lib/watchlist/position-intent";
import { tryAutopostFueledOnPublish } from "@/lib/social/x-fueled-autopost";
import { isMissingColumnDbError } from "@/lib/calls/call-fields";
import { isDeskPublishIdentity } from "@/lib/admin/publish-identity";
import {
  pendingEntryExpiresAt,
  validateConditionalTrigger,
} from "@/lib/calls/pending-entry";
import { linkDiscoveryCandidateToCall } from "@/lib/desk-discovery/publish-link";

const createSchema = z.object({
  symbol: z.string().min(1).max(12),
  assetClass: z.enum(["equity", "crypto"]).default("equity"),
  direction: z.enum(["long", "short"]),
  thesis: z.string().min(10).max(5000),
  entryMode: z.enum(["live", "conditional"]).default("live"),
  triggerEntryPrice: z.number().positive().optional(),
  targetPrice: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  timeframeTag: z.string().max(32).optional(),
  sourceTweetUrl: z.string().url().max(500).optional(),
  socialAnalysisMode: z.enum(["default", "deep"]).optional(),
  socialAnalysisRawText: z.string().min(12).max(8000).optional(),
  discoveryCandidateId: z.string().uuid().optional(),
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

    const { data: userRow } = await db
      .from("users")
      .select("submission_quota_week, calls_count")
      .eq("id", session.userId)
      .single();

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    if (!isDeskPublishIdentity(session)) {
      const { count } = await db
        .from("calls")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.userId)
        .gte("called_at", weekAgo);

      const quota = userRow?.submission_quota_week ?? 2;
      if ((count ?? 0) >= quota) {
        return NextResponse.json({ error: "quota_exceeded", quota }, { status: 403 });
      }
    }

    const validated = await validateSymbol(symbol, body.assetClass);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const resolvedSymbol = validated.symbol;
    let marketPrice: number | null = null;
    if (body.assetClass === "crypto" && validated.finnhubSymbol) {
      marketPrice = (await getCryptoLastPrice(validated.finnhubSymbol)) ?? null;
    } else {
      const quote = await getQuote(resolvedSymbol);
      marketPrice = quote?.c ?? null;
    }

    if (marketPrice == null) {
      return NextResponse.json({ error: "quote_unavailable" }, { status: 503 });
    }

    const entryMode = body.entryMode ?? "live";
    const isConditional = entryMode === "conditional";

    if (isConditional && body.triggerEntryPrice == null) {
      return NextResponse.json({ error: "trigger_required" }, { status: 400 });
    }

    if (isConditional && body.triggerEntryPrice != null) {
      const triggerCheck = validateConditionalTrigger({
        direction: body.direction,
        triggerPrice: body.triggerEntryPrice,
        marketPrice,
      });
      if (!triggerCheck.ok) {
        return NextResponse.json({ error: triggerCheck.error }, { status: 400 });
      }
    }

    await db.from("ticker_snapshots").upsert({
      symbol: resolvedSymbol,
      company_name: validated.name ?? resolvedSymbol,
      last_price: marketPrice,
      asset_class: body.assetClass,
      finnhub_symbol: validated.finnhubSymbol ?? null,
      updated_at: new Date().toISOString(),
    } as never);

    const isFueled = isDeskPublishIdentity(session);
    const sourceTweetUrl =
      session.role === "admin" && body.sourceTweetUrl?.trim()
        ? body.sourceTweetUrl.trim()
        : null;
    const socialRawText =
      session.role === "admin" && body.socialAnalysisRawText?.trim()
        ? body.socialAnalysisRawText.trim()
        : null;

    const entryForRecord = isConditional ? null : marketPrice;
    const returnPct =
      !isConditional && entryForRecord != null
        ? computeReturnPct({
            direction: body.direction,
            basisPrice: Number(entryForRecord),
            lastPrice: marketPrice,
          })
        : null;
    let targetProgress: number | null = null;
    if (!isConditional && entryForRecord != null && body.targetPrice != null) {
      targetProgress = computeTargetProgress({
        direction: body.direction,
        entry: Number(entryForRecord),
        target: body.targetPrice,
        lastPrice: marketPrice,
      });
    }
    const scorePoints = computeScorePoints({
      returnPct,
      peakReturnPct: returnPct,
      voteScore: 0,
      ageDays: 0,
    });

    const insertPayload = {
        user_id: session.userId,
        symbol: resolvedSymbol,
        asset_class: body.assetClass,
        direction: body.direction,
        thesis: body.thesis.trim(),
        called_at: new Date().toISOString(),
        entry_mode: entryMode,
        call_state: isConditional ? "pending_entry" : "active",
        trigger_entry_price: isConditional ? body.triggerEntryPrice : null,
        activated_at: isConditional ? null : new Date().toISOString(),
        expires_at: isConditional ? pendingEntryExpiresAt() : null,
        entry_price: entryForRecord,
        target_price: body.targetPrice ?? null,
        stop_price: body.stopPrice ?? null,
        timeframe_tag: body.timeframeTag ?? null,
        price_at_call: marketPrice,
        last_price: marketPrice,
        return_pct: returnPct,
        peak_return_pct: returnPct,
        target_progress: targetProgress,
        score_points: scorePoints,
        is_fueled: isFueled,
        source_tweet_url: sourceTweetUrl,
    };

    let { data: call, error } = await db
      .from("calls")
      .insert(insertPayload as never)
      .select(
        "id, symbol, entry_price, target_price, stop_price, thesis, return_pct, direction, is_fueled"
      )
      .single();

    if (error && isMissingColumnDbError(error) && insertPayload.peak_return_pct != null) {
      const { peak_return_pct: _p, ...legacyInsert } = insertPayload;
      ({ data: call, error } = await db
        .from("calls")
        .insert(legacyInsert as never)
        .select(
          "id, symbol, entry_price, target_price, stop_price, thesis, return_pct, direction, is_fueled"
        )
        .single());
    }

    if (error || !call) {
      console.error("[calls POST]", error);
      return NextResponse.json({ error: "create_failed" }, { status: 500 });
    }

    const createdCall = call;

    if (isFueled && sourceTweetUrl) {
      void attachSocialResearchSnapshotToCall({
        callId: createdCall.id,
        symbol: resolvedSymbol,
        mode: body.socialAnalysisMode ?? "default",
        tweetUrl: sourceTweetUrl,
      });
    } else if (isFueled && socialRawText) {
      void attachCachedResearchSnapshotToCall({
        callId: createdCall.id,
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
      callId: createdCall.id,
      symbol: createdCall.symbol,
      callerUserId: session.userId,
      callerUsername: session.username,
      callerDisplayName: session.displayName,
      direction: body.direction,
    });

    void notifyFollowedMemberNewCall({
      callId: createdCall.id,
      symbol: createdCall.symbol,
      callerUserId: session.userId,
      callerUsername: session.username,
      callerDisplayName: session.displayName,
      direction: body.direction,
    });

    void notifyDiscordNewCall({
      callId: createdCall.id,
      symbol: createdCall.symbol,
      direction: body.direction,
      isFueled,
      displayName: session.displayName,
      username: session.username,
      thesis: createdCall.thesis,
      entryPrice: createdCall.entry_price,
      targetPrice: createdCall.target_price,
      stopPrice: createdCall.stop_price,
      returnPct: createdCall.return_pct,
    }).catch((e) => console.error("[discord/new-call]", e));

    void refreshQuotesForSymbols([resolvedSymbol]).catch((e) =>
      console.error("[calls POST refresh-quotes]", e)
    );

    if (isFueled) {
      void tryAutopostFueledOnPublish(createdCall.id).catch((e) =>
        console.error("[calls POST x-fueled-autopost]", e)
      );
      if (body.discoveryCandidateId) {
        void linkDiscoveryCandidateToCall({
          candidateId: body.discoveryCandidateId,
          callId: createdCall.id,
          symbol: resolvedSymbol,
        });
      }
    }

    void markWatchlistActiveOnPublish(session.userId, resolvedSymbol).catch((e) =>
      console.error("[calls POST watchlist-intent]", e)
    );

    return NextResponse.json({ ok: true, call: createdCall });
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
