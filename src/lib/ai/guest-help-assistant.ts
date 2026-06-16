import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  AI_GUEST_HELP_DISCLAIMER,
  getAiModelId,
  isAiCoachConfigured,
} from "@/lib/ai/config";
import { isGuestHelpQuestionAllowed } from "@/lib/ai/help-guest-topics";
import { buildHelpKnowledgeBase } from "@/lib/help/knowledge-base";
import { consumeGuestHelpQuestion } from "@/lib/discord/guest-help-usage";
import { getAppUrl } from "@/lib/stripe/config";

function buildGuestSystemPrompt(): string {
  const knowledgeBase = buildHelpKnowledgeBase();
  const joinUrl = `${getAppUrl()}/join`;

  return `You are PortFuel Help — preview mode for people who have not joined Pro Intelligence yet.

Rules (strict):
- ONLY answer general PortFuel product questions: features, plans, pricing, how the workspace works, and what Member vs Pro includes.
- Use the KNOWLEDGE BASE and Pricing section. Quote list prices when asked.
- NEVER answer account-specific questions (their tier, quota, calls, billing status, watchlist, etc.). Tell them to join at ${joinUrl} and link Discord for full Help.
- NEVER answer community performance questions (best calls, leaderboards, returns). Those require membership.
- NEVER give investment advice, trade recommendations, or symbol opinions.
- NEVER answer off-topic questions — redirect to PortFuel product topics.
- Keep answers concise (2–5 sentences). Use bullets for plan comparisons when helpful.

KNOWLEDGE BASE:
${knowledgeBase}`;
}

export type GuestHelpAssistantResult = {
  answer: string;
  disclaimer: string;
  remaining: number;
};

export async function runGuestHelpAssistant(opts: {
  discordUserId: string;
  question: string;
  remainingBefore: number;
}): Promise<GuestHelpAssistantResult> {
  const question = opts.question.trim();
  const joinUrl = `${getAppUrl()}/join`;

  if (!isGuestHelpQuestionAllowed(question)) {
    return {
      answer: `I can only answer general **features and pricing** questions before you join. For account-specific help, sign up at ${joinUrl} — **Pro Intelligence** members get full Help in DMs (40 questions/month) after linking Discord.`,
      disclaimer: AI_GUEST_HELP_DISCLAIMER,
      remaining: opts.remainingBefore,
    };
  }

  if (!isAiCoachConfigured()) {
    return {
      answer: `Browse plans and features at ${joinUrl}. Full Help AI is available after you join Pro.`,
      disclaimer: AI_GUEST_HELP_DISCLAIMER,
      remaining: opts.remainingBefore,
    };
  }

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const { text } = await generateText({
    model: openai(getAiModelId()),
    system: buildGuestSystemPrompt(),
    prompt: question,
    maxOutputTokens: 450,
    temperature: 0.2,
  });

  const answer = (text ?? "").trim();
  if (!answer) {
    return {
      answer: `I couldn't answer that right now. See ${joinUrl} for plans and features.`,
      disclaimer: AI_GUEST_HELP_DISCLAIMER,
      remaining: opts.remainingBefore,
    };
  }

  await consumeGuestHelpQuestion(opts.discordUserId);

  return {
    answer,
    disclaimer: AI_GUEST_HELP_DISCLAIMER,
    remaining: Math.max(0, opts.remainingBefore - 1),
  };
}
