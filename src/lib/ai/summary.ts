import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  AI_SUMMARY_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { consumeAiSummaryGeneration } from "@/lib/ai/summary-usage";

const summarySchema = z.object({
  summaryLine: z.string().min(20).max(220),
});

const SYSTEM = `You write a single skimmable line summarizing a member's trade thesis on PortFuel.

Rules:
- Max one sentence, under 200 characters.
- Format exactly: "Case: … · Risk: …" (use middle dot · between parts).
- Neutral, educational tone — no buy/sell/hold, no price targets, no advice.
- Reflect the author's stated direction (long/short) without endorsing it.`;

export type CallSummaryContext = {
  callId: string;
  symbol: string;
  assetClass: "equity" | "crypto";
  direction: "long" | "short";
  thesis: string;
  timeframeTag?: string | null;
};

function demoSummary(ctx: CallSummaryContext): string {
  const t = ctx.thesis.trim();
  const snippet = t.length > 80 ? `${t.slice(0, 77)}…` : t;
  return `Case: ${ctx.direction} ${ctx.symbol} — ${snippet} · Risk: thesis depends on timing and levels the author set.`;
}

export async function fetchCachedThesisSummary(
  callId: string
): Promise<string | null> {
  if (isDemoMode()) return null;

  const db = createServiceClient();
  const { data } = await db
    .from("call_thesis_summaries")
    .select("summary_line")
    .eq("call_id", callId)
    .maybeSingle();

  return (data as { summary_line: string } | null)?.summary_line ?? null;
}

async function persistSummary(callId: string, summaryLine: string): Promise<void> {
  const db = createServiceClient();
  const { error } = await db.from("call_thesis_summaries").upsert(
    {
      call_id: callId,
      summary_line: summaryLine,
    } as never,
    { onConflict: "call_id" }
  );
  if (error) console.error("[ai/summary/persist]", error);
}

export async function getOrCreateThesisSummary(opts: {
  userId: string;
  ctx: CallSummaryContext;
  allowGenerate: boolean;
}): Promise<
  | { summaryLine: string; cached: boolean; disclaimer: string }
  | { error: "pro_required" | "quota_exceeded" | "not_cached" | "ai_unavailable" }
> {
  if (isDemoMode()) {
    return {
      summaryLine: demoSummary(opts.ctx),
      cached: false,
      disclaimer: AI_SUMMARY_DISCLAIMER,
    };
  }

  const cached = await fetchCachedThesisSummary(opts.ctx.callId);
  if (cached) {
    return {
      summaryLine: cached,
      cached: true,
      disclaimer: AI_SUMMARY_DISCLAIMER,
    };
  }

  if (!opts.allowGenerate) {
    return { error: "not_cached" };
  }

  if (isDemoMode() || !isAiCoachConfigured()) {
    const line = demoSummary(opts.ctx);
    await persistSummary(opts.ctx.callId, line);
    return { summaryLine: line, cached: false, disclaimer: AI_SUMMARY_DISCLAIMER };
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const userPrompt = `Symbol: ${opts.ctx.symbol} (${opts.ctx.assetClass})
Direction: ${opts.ctx.direction}
Timeframe: ${opts.ctx.timeframeTag?.trim() || "unspecified"}

Thesis:
${opts.ctx.thesis.trim()}`;

  const { output } = await generateText({
    model: openai(getAiModelId()),
    system: SYSTEM,
    prompt: userPrompt,
    output: Output.object({ schema: summarySchema }),
    maxOutputTokens: 120,
  });

  if (!output?.summaryLine) {
    return { error: "ai_unavailable" };
  }

  const line = output.summaryLine.trim();
  await persistSummary(opts.ctx.callId, line);
  await consumeAiSummaryGeneration(opts.userId);

  return {
    summaryLine: line,
    cached: false,
    disclaimer: AI_SUMMARY_DISCLAIMER,
  };
}

export async function loadCallForSummary(callId: string): Promise<CallSummaryContext | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("calls")
    .select("id, symbol, asset_class, direction, thesis, timeframe_tag")
    .eq("id", callId)
    .maybeSingle();

  if (!data) return null;

  const row = data as {
    id: string;
    symbol: string;
    asset_class: string;
    direction: string;
    thesis: string;
    timeframe_tag: string | null;
  };

  return {
    callId: row.id,
    symbol: row.symbol,
    assetClass: row.asset_class === "crypto" ? "crypto" : "equity",
    direction: row.direction === "short" ? "short" : "long",
    thesis: row.thesis,
    timeframeTag: row.timeframe_tag,
  };
}
