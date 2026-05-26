import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  AI_COACH_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import {
  thesisCoachOutputSchema,
  type ThesisCoachInput,
  type ThesisCoachResponse,
} from "@/lib/ai/types";
import { summarizeMemberTrackRecord } from "@/lib/users/member-track-record";
import { consumeAiCoachReview } from "@/lib/ai/usage";
import type { MembershipTier } from "@/lib/stripe/config";

const SYSTEM_PROMPT = `You are PortFuel Thesis Coach — an educational assistant for traders documenting ideas on an accountability platform.

Rules (strict):
- Do NOT recommend buying, selling, holding, or sizing positions.
- Do NOT predict prices or guarantee outcomes.
- DO critique thesis structure, risk/reward coherence, clarity, timeframe, and what evidence is missing.
- Use neutral, coaching tone. Short bullets where helpful.
- If entry/target/stop are provided, comment on whether they are internally consistent for the stated direction (without saying to change them to specific prices).
- Frame everything as questions and process feedback for the author.`;

function formatLevels(input: ThesisCoachInput): string {
  const parts: string[] = [];
  if (input.entryPrice != null) parts.push(`Entry: ${input.entryPrice}`);
  if (input.targetPrice != null) parts.push(`Target: ${input.targetPrice}`);
  if (input.stopPrice != null) parts.push(`Stop: ${input.stopPrice}`);
  return parts.length ? parts.join(" · ") : "Levels: not provided";
}

async function buildHistoryBlock(userId: string): Promise<string | null> {
  const db = createServiceClient();
  const { data: calls } = await db
    .from("calls")
    .select("symbol, direction, return_pct, target_progress, called_at")
    .eq("user_id", userId)
    .order("called_at", { ascending: false })
    .limit(20);

  if (!calls?.length) return null;

  const stats = summarizeMemberTrackRecord(
    calls.map((c) => ({
      return_pct: c.return_pct,
      direction: c.direction as "long" | "short",
      is_fueled: false,
    }))
  );

  const recent = calls
    .slice(0, 6)
    .map((c) => {
      const row = c as {
        symbol: string;
        direction: string;
        return_pct: number | null;
        target_progress: number | null;
      };
      const ret =
        row.return_pct != null ? `${Number(row.return_pct).toFixed(1)}%` : "unmarked";
      const prog =
        row.target_progress != null
          ? ` · target progress ${Math.round(Number(row.target_progress))}%`
          : "";
      return `- ${row.symbol} ${row.direction}: ${ret}${prog}`;
    })
    .join("\n");

  return `Author track record (last ${calls.length} published calls, educational context only):
- Win/loss mix: ${stats.winners}W / ${stats.losers}L · ${stats.longCount} long / ${stats.shortCount} short
- Avg return (marked): ${stats.avgReturnPct != null ? `${stats.avgReturnPct.toFixed(1)}%` : "n/a"}
Recent:
${recent}`;
}

function demoReview(input: ThesisCoachInput): ThesisCoachResponse["review"] {
  return {
    summary: `Demo coaching for ${input.symbol} ${input.direction}: your thesis has a clear directional view. Tighten catalyst timing and make risk explicit before publishing.`,
    strengths: [
      "Direction and symbol are stated clearly for accountability.",
      "Thesis text gives other members something concrete to evaluate.",
    ],
    risks: [
      "Confirm whether entry/target/stop align with your stated timeframe.",
      "Spell out what would invalidate the idea (not just the stop level).",
    ],
    questionsToAsk: [
      "What single datapoint would make me abandon this thesis early?",
      "Is my reward/risk realistic for this timeframe tag?",
      "What is the bear/bull case I am dismissing too quickly?",
    ],
    checklist: {
      thesisClarity: "developing",
      riskDefinition: input.stopPrice != null ? "partial" : "missing",
      timeframeFit: input.timeframeTag ? "ok" : "unclear",
    },
  };
}

export async function runThesisCoachReview(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  input: ThesisCoachInput;
  usageBefore: { used: number; limit: number; periodMonth: string };
}): Promise<ThesisCoachResponse> {
  const includeHistory =
    Boolean(opts.input.includeHistory) &&
    (opts.membershipTier === "pro" || opts.role === "admin");

  let review: ThesisCoachResponse["review"];

  if (isDemoMode() || !isAiCoachConfigured()) {
    review = demoReview(opts.input);
  } else {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const historyBlock = includeHistory ? await buildHistoryBlock(opts.userId) : null;

    const userPrompt = `Review this draft call (educational coaching only):

Symbol: ${opts.input.symbol} (${opts.input.assetClass})
Direction: ${opts.input.direction}
Timeframe tag: ${opts.input.timeframeTag?.trim() || "not specified"}
${formatLevels(opts.input)}

Thesis:
${opts.input.thesis.trim()}

${historyBlock ? `\n${historyBlock}\n` : ""}

Return structured feedback for the author.`;

    const { output } = await generateText({
      model: openai(getAiModelId()),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      output: Output.object({ schema: thesisCoachOutputSchema }),
      maxOutputTokens: 1400,
    });

    if (!output) throw new Error("ai_empty_response");
    review = output;
  }

  const used = isDemoMode()
    ? Math.min(opts.usageBefore.used + 1, opts.usageBefore.limit)
    : await consumeAiCoachReview(opts.userId);

  return {
    review,
    usage: {
      used,
      limit: opts.usageBefore.limit,
      remaining: Math.max(0, opts.usageBefore.limit - used),
      periodMonth: opts.usageBefore.periodMonth,
    },
    disclaimer: AI_COACH_DISCLAIMER,
    historyIncluded: includeHistory,
  };
}
