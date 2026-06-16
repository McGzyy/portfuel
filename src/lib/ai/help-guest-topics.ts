import {
  questionMentionsCommunityData,
  questionMentionsUserData,
} from "@/lib/ai/help-question-dates";

/** Guest preview may only cover public product info — not account or platform data. */
export function isGuestHelpQuestionAllowed(question: string): boolean {
  const q = question.trim();
  if (!q) return false;

  if (questionMentionsUserData(q)) return false;
  if (questionMentionsCommunityData(q)) return false;

  if (
    /\b(my account|my subscription|my billing|my invoice|my password|my email|logged in|sign[\s-]?in|login issue|account-specific)\b/i.test(
      q
    )
  ) {
    return false;
  }

  if (/\b(highest|best|top|worst|leaderboard)\b/i.test(q) && /\b(call|return|performance)\b/i.test(q)) {
    return false;
  }

  const productTopics =
    /\b(price|pricing|cost|how much|plan|plans|member|pro|feature|features|what is|what's|how do|how does|join|signup|sign up|subscribe|billing|annual|monthly|workspace|call|calls|watchlist|journal|research|discord|feed|ranking|difference between|include|includes|compare|tier|portfuel|free|trial|upgrade)\b/i;

  return productTopics.test(q);
}
