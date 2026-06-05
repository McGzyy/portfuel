import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  AI_JOURNAL_ALERT_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { fetchJournalAlertAiUsage, consumeJournalAlertAi } from "@/lib/ai/journal-alert-usage";
import type { MembershipTier } from "@/lib/stripe/config";

export type JournalAlertKind = "price_move" | "earnings" | "plan_level";

export async function maybeEnhanceWatchlistAlertBody(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  symbol: string;
  kind: JournalAlertKind;
  baseBody: string;
  thesis?: string | null;
  conviction?: number | null;
  entryPrice?: number | null;
  stopPrice?: number | null;
  targetPrice?: number | null;
  aiInsightsEnabled: boolean;
}): Promise<string> {
  if (!opts.aiInsightsEnabled || !isAiCoachConfigured()) return opts.baseBody;

  const usage = await fetchJournalAlertAiUsage({
    userId: opts.userId,
    membershipTier: opts.membershipTier,
    role: opts.role,
  });
  if (usage.remaining <= 0) return opts.baseBody;

  const thesis = opts.thesis?.trim();
  if (!thesis && opts.conviction == null) return opts.baseBody;

  const levelBits: string[] = [];
  if (opts.entryPrice != null) levelBits.push(`Entry ${opts.entryPrice}`);
  if (opts.stopPrice != null) levelBits.push(`Stop ${opts.stopPrice}`);
  if (opts.targetPrice != null) levelBits.push(`Target ${opts.targetPrice}`);

  const kindLabel =
    opts.kind === "price_move"
      ? "price move vs your add price"
      : opts.kind === "earnings"
        ? "upcoming earnings"
        : "journal plan level touch";

  const prompt = `You write one short sentence (max 120 chars) to append to a watchlist alert for the author's private journal.

Symbol: ${opts.symbol}
Alert: ${opts.baseBody}
Context: ${kindLabel}
Thesis excerpt: ${thesis ? thesis.slice(0, 400) : "none"}
Conviction: ${opts.conviction ?? "n/a"}/10
Plan levels: ${levelBits.length ? levelBits.join(" · ") : "none"}

Rules: No buy/sell/hold advice. Reference their thesis or plan only. One sentence.`;

  try {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const { text } = await generateText({
      model: openai(getAiModelId()),
      system: `PortFuel journal alert helper. ${AI_JOURNAL_ALERT_DISCLAIMER}`,
      prompt,
      maxOutputTokens: 80,
    });

    const insight = text.trim().replace(/\s+/g, " ");
    if (!insight || insight.length < 8) return opts.baseBody;

    await consumeJournalAlertAi(opts.userId);
    return `${opts.baseBody} ${insight}`;
  } catch (e) {
    console.error("[ai/journal-alert]", e);
    return opts.baseBody;
  }
}
