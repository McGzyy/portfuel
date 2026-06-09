import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  AI_HELP_ASSISTANT_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { buildHelpKnowledgeBase } from "@/lib/help/knowledge-base";
import { consumeHelpAssistantQuestion } from "@/lib/ai/help-assistant-usage";

const KNOWLEDGE_BASE = buildHelpKnowledgeBase();

const SYSTEM_PROMPT = `You are PortFuel Help Assistant — a product support bot for the PortFuel trading workspace.

Rules (strict):
- ONLY answer questions about PortFuel: features, navigation, billing, calls, watchlist, journal, Pro research, account settings, support, and how the product works.
- Use the KNOWLEDGE BASE below as your primary source. If the answer is not there, say you are not sure and suggest opening a support ticket or emailing support@portfuel.pro.
- NEVER give investment advice, trade recommendations, price predictions, or opinions on symbols.
- NEVER answer general knowledge, coding, politics, or off-topic questions — politely redirect to PortFuel topics.
- For account-specific issues (billing disputes, bans, missing access), explain the general process then recommend a support ticket with details.
- Keep answers concise (2–6 sentences unless steps are needed). Use short bullet steps when helpful.
- Do not claim features that are not in the knowledge base.

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}`;

export type HelpAssistantResult = {
  answer: string;
  disclaimer: string;
  remaining: number;
};

export async function runHelpAssistant(opts: {
  userId: string;
  question: string;
  remainingBefore: number;
}): Promise<HelpAssistantResult> {
  if (!isAiCoachConfigured()) {
    return {
      answer:
        "The help assistant is not configured in this environment. Browse the docs or open a support ticket.",
      disclaimer: AI_HELP_ASSISTANT_DISCLAIMER,
      remaining: opts.remainingBefore,
    };
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const { text } = await generateText({
    model: openai(getAiModelId()),
    system: SYSTEM_PROMPT,
    prompt: opts.question.trim(),
    maxOutputTokens: 500,
    temperature: 0.2,
  });

  await consumeHelpAssistantQuestion(opts.userId);

  return {
    answer: text.trim(),
    disclaimer: AI_HELP_ASSISTANT_DISCLAIMER,
    remaining: Math.max(0, opts.remainingBefore - 1),
  };
}
