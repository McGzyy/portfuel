import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import { createServiceClient } from "@/lib/db/supabase";
import { analyzeTickerFromPost } from "@/lib/ai/ticker-analyze";
import type { AnalysisMode } from "@/lib/ai/social-analysis-cache";
import { deriveTweetKey } from "@/lib/ai/social-analysis-cache";
import { AI_ASSIST_LIMITS } from "@/lib/ai/ai-assist-limits";

const schema = z.object({
  rawText: z.string().min(12).max(8000),
  symbol: z.string().min(1).max(12),
  inPostSnippet: z.string().max(500).optional(),
  adminNote: z.string().max(500).optional(),
  assetClass: z.enum(["equity", "crypto"]).optional(),
  mode: z.enum(["default", "deep"]).optional(),
});

async function assertWithinDailyLimit(userId: string, mode: AnalysisMode): Promise<void> {
  const db = createServiceClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const limit =
    mode === "deep" ? AI_ASSIST_LIMITS.deepPerDay : AI_ASSIST_LIMITS.defaultPerDay;
  const { count } = await db
    .from("ai_draft_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mode", mode)
    .gte("created_at", start.toISOString());

  if ((count ?? 0) >= limit) {
    throw new Error(mode === "deep" ? "ai_deep_limit_reached" : "ai_limit_reached");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const tier = effectiveMembershipTier(session.membershipTier, session.proGrantedUntil);
    if (session.role !== "admin" && tier !== "pro") {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    const body = schema.parse(await request.json());
    const mode = (body.mode ?? "default") as AnalysisMode;

    await assertWithinDailyLimit(session.userId, mode);

    const result = await analyzeTickerFromPost({
      rawText: body.rawText,
      tweetUrl: null,
      symbol: body.symbol,
      inPostSnippet: body.inPostSnippet,
      adminNote: body.adminNote,
      assetClass: body.assetClass,
      mode,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const tweetKey = deriveTweetKey(null, body.rawText);
    const db = createServiceClient();
    void db.from("ai_draft_requests").insert({
      user_id: session.userId,
      mode,
      symbol: body.symbol.toUpperCase(),
      tweet_key: tweetKey,
    } as never);

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "totp_required") {
      return NextResponse.json({ error: "totp_required" }, { status: 403 });
    }
    if (e instanceof Error && (e.message === "ai_limit_reached" || e.message === "ai_deep_limit_reached")) {
      return NextResponse.json({ error: e.message }, { status: 429 });
    }
    console.error("[social/analyze-ticker]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

