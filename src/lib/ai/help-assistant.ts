import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  AI_HELP_ASSISTANT_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { buildHelpDataFactsBlock } from "@/lib/ai/help-data-facts";
import { buildHelpUserContextBlock } from "@/lib/ai/help-user-context";
import { consumeHelpAssistantQuestion } from "@/lib/ai/help-assistant-usage";
import { buildHelpKnowledgeBase } from "@/lib/help/knowledge-base";

function buildSystemPrompt(liveContext: string): string {
  const knowledgeBase = buildHelpKnowledgeBase();

  return `You are PortFuel Help Assistant — a product support bot for the PortFuel trading workspace.

Rules (strict):
- ONLY answer questions about PortFuel: features, navigation, billing, calls, watchlist, journal, Pro research, account settings, support, and how the product works.
- Use the KNOWLEDGE BASE as your primary source for product how-to and policy.
- When LIVE ACCOUNT DATA is present, use it for this member's tier, quota, stats, and account-specific answers.
- When LIVE PLATFORM DATA is present, use it for call performance / leaderboard-style questions. Only cite numbers from that section — never invent returns or dates.
- The Pricing section in the knowledge base has current list prices — use it for "how much does Pro/Member cost" questions.
- If the answer is not in the knowledge base or live data sections, say you are not sure and suggest opening a support ticket or emailing support@portfuel.pro.
- NEVER give investment advice, trade recommendations, price predictions, or opinions on symbols.
- NEVER answer general knowledge, coding, politics, or off-topic questions — politely redirect to PortFuel topics.
- For billing disputes, payment failures, bans, or missing access after checkout, explain the general process then recommend a support ticket with details.
- Keep answers concise (2–6 sentences unless steps are needed). Use short bullet steps when helpful.
- Do not claim features that are not in the knowledge base.

KNOWLEDGE BASE:
${knowledgeBase}

${liveContext}`;
}

export type HelpAssistantResult = {
  answer: string;
  disclaimer: string;
  remaining: number;
};

async function buildLiveContext(userId: string, question: string): Promise<string> {
  const [account, data] = await Promise.all([
    buildHelpUserContextBlock(userId),
    buildHelpDataFactsBlock(userId, question),
  ]);
  return [account, data].filter(Boolean).join("\n\n");
}

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

  const liveContext = await buildLiveContext(opts.userId, opts.question.trim());
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const { text } = await generateText({
    model: openai(getAiModelId()),
    system: buildSystemPrompt(liveContext),
    prompt: opts.question.trim(),
    maxOutputTokens: 500,
    temperature: 0.2,
  });

  const answer = (text ?? "").trim();
  if (!answer) {
    return {
      answer:
        "I couldn't generate an answer right now. Try rephrasing your question or open a support ticket on portfuel.pro.",
      disclaimer: AI_HELP_ASSISTANT_DISCLAIMER,
      remaining: opts.remainingBefore,
    };
  }

  await consumeHelpAssistantQuestion(opts.userId);

  return {
    answer,
    disclaimer: AI_HELP_ASSISTANT_DISCLAIMER,
    remaining: Math.max(0, opts.remainingBefore - 1),
  };
}
