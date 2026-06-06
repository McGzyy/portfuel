import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import {
  AI_JOURNAL_RESEARCH_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { consumeJournalResearch } from "@/lib/ai/journal-research-usage";
import {
  journalResearchOutputSchema,
  type JournalResearchInput,
  type JournalResearchResponse,
} from "@/lib/ai/journal-research-types";
import type { MembershipTier } from "@/lib/stripe/config";

const SYSTEM = `You are PortFuel Journal Research — an educational assistant for a trader's PRIVATE research notebook.

Rules (strict):
- Do NOT recommend buying, selling, holding, or position sizing.
- Do NOT predict prices or guarantee outcomes.
- DO help the author think like a research analyst: what evidence is missing, what could falsify the thesis, what to read or watch next.
- Reference their catalysts, risks, and plan levels only as process checks — not trade advice.
- Be specific to the symbol and thesis text provided.
- Short, scannable bullets.`;

function formatInput(input: JournalResearchInput): string {
  const levels: string[] = [];
  if (input.entry_price != null) levels.push(`Entry ${input.entry_price}`);
  if (input.stop_price != null) levels.push(`Stop ${input.stop_price}`);
  if (input.target_price != null) levels.push(`Target ${input.target_price}`);
  const scenarios: string[] = [];
  if (input.bull_case_price != null) scenarios.push(`Bull ${input.bull_case_price}`);
  if (input.base_case_price != null) scenarios.push(`Base ${input.base_case_price}`);
  if (input.bear_case_price != null) scenarios.push(`Bear ${input.bear_case_price}`);

  const entries =
    input.recent_entries.length > 0
      ? input.recent_entries.map((e, i) => `${i + 1}. ${e.slice(0, 300)}`).join("\n")
      : "None yet";

  return `Symbol: ${input.symbol}
Outcome tag: ${input.outcome ?? "watching"}
Conviction: ${input.conviction ?? "not set"}/10
Thesis:
${input.thesis?.trim() || "(empty — prompt them to draft a thesis)"}

Catalysts: ${input.catalysts.length ? input.catalysts.join(", ") : "none"}
Risk factors: ${input.risk_factors?.trim() || "none"}
Plan levels: ${levels.length ? levels.join(" · ") : "none"}
Scenarios: ${scenarios.length ? scenarios.join(" · ") : "none"}

Recent journal entries:
${entries}`;
}

export async function runJournalResearchReview(opts: {
  userId: string;
  membershipTier: MembershipTier | null;
  role: "member" | "admin";
  input: JournalResearchInput;
  usageBefore: { used: number; limit: number; periodMonth: string };
}): Promise<JournalResearchResponse> {
  if (!isAiCoachConfigured()) {
    throw new Error("ai_not_configured");
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const { output } = await generateText({
    model: openai(getAiModelId()),
    system: `${SYSTEM}\n\n${AI_JOURNAL_RESEARCH_DISCLAIMER}`,
    prompt: `Review this private journal idea and return structured research feedback.\n\n${formatInput(opts.input)}`,
    output: Output.object({ schema: journalResearchOutputSchema }),
  });

  if (!output) throw new Error("ai_empty_response");

  const used = await consumeJournalResearch(opts.userId);

  return {
    ...output,
    usage: {
      used,
      limit: opts.usageBefore.limit,
      remaining: Math.max(0, opts.usageBefore.limit - used),
      periodMonth: opts.usageBefore.periodMonth,
    },
  };
}
