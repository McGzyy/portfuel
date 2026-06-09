import type { MembershipTier } from "@/lib/stripe/config";

export const AI_COACH_DISCLAIMER =
  "Educational thesis coaching only — not investment advice. AI can be wrong. You are responsible for your own trades.";

/** Monthly reviews per calendar month (UTC). */
export const AI_COACH_MONTHLY_LIMIT: Record<MembershipTier | "admin", number> = {
  member: 2,
  pro: 30,
  admin: 200,
};

/** Generating new one-line summaries (reads of cached summaries are free). */
export const AI_SUMMARY_MONTHLY_LIMIT: Record<MembershipTier | "admin", number> = {
  member: 0,
  pro: 60,
  admin: 500,
};

export const AI_SUMMARY_DISCLAIMER =
  "AI summary for skimming only — not investment advice. Read the full thesis.";

/** AI-enhanced watchlist alert copy (journal context) — more generous than thesis coach. */
export const AI_JOURNAL_ALERT_MONTHLY_LIMIT: Record<MembershipTier | "admin", number> = {
  member: 15,
  pro: 75,
  admin: 500,
};

export const AI_JOURNAL_ALERT_DISCLAIMER =
  "AI alert context for your journal only — not investment advice.";

/** AI research reviews on private journal theses — generous vs call coach. */
export const AI_JOURNAL_RESEARCH_MONTHLY_LIMIT: Record<MembershipTier | "admin", number> = {
  member: 12,
  pro: 60,
  admin: 500,
};

export const AI_JOURNAL_RESEARCH_DISCLAIMER =
  "Educational research prompts for your private journal only — not investment advice.";

/** On-demand AI watchlist digest — Pro only in app. */
export const AI_WATCHLIST_DIGEST_MONTHLY_LIMIT: Record<MembershipTier | "admin", number> = {
  member: 0,
  pro: 8,
  admin: 100,
};

export const AI_WATCHLIST_DIGEST_DISCLAIMER =
  "Educational summary of your watchlist context — not investment advice. AI can be wrong.";

/** PortFuel help assistant — Pro-only product Q&A grounded in docs. */
export const AI_HELP_ASSISTANT_MONTHLY_LIMIT: Record<MembershipTier | "admin", number> = {
  member: 0,
  pro: 40,
  admin: 300,
};

export const AI_HELP_ASSISTANT_DISCLAIMER =
  "Answers PortFuel product questions only — not investment advice. AI can be wrong; open a support ticket for account-specific issues.";

export function isAiCoachConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key?.startsWith("sk-"));
}

export function getAiModelId(): string {
  return process.env.AI_COACH_MODEL?.trim() || "gpt-4o-mini";
}

/** Higher-quality model for admin-only deep research (opt-in). */
export function getAiDeepModelId(): string {
  return process.env.AI_COACH_DEEP_MODEL?.trim() || "gpt-4o";
}

export function limitForRole(
  tier: MembershipTier | null,
  role: "member" | "admin"
): number {
  if (role === "admin") return AI_COACH_MONTHLY_LIMIT.admin;
  return AI_COACH_MONTHLY_LIMIT[tier === "pro" ? "pro" : "member"];
}

export function summaryLimitForRole(
  tier: MembershipTier | null,
  role: "member" | "admin"
): number {
  if (role === "admin") return AI_SUMMARY_MONTHLY_LIMIT.admin;
  return AI_SUMMARY_MONTHLY_LIMIT[tier === "pro" ? "pro" : "member"];
}

export function canGenerateSummary(
  tier: MembershipTier | null,
  role: "member" | "admin"
): boolean {
  return role === "admin" || tier === "pro";
}

export function journalAlertLimitForRole(
  tier: MembershipTier | null,
  role: "member" | "admin"
): number {
  if (role === "admin") return AI_JOURNAL_ALERT_MONTHLY_LIMIT.admin;
  return AI_JOURNAL_ALERT_MONTHLY_LIMIT[tier === "pro" ? "pro" : "member"];
}

export function journalResearchLimitForRole(
  tier: MembershipTier | null,
  role: "member" | "admin"
): number {
  if (role === "admin") return AI_JOURNAL_RESEARCH_MONTHLY_LIMIT.admin;
  return AI_JOURNAL_RESEARCH_MONTHLY_LIMIT[tier === "pro" ? "pro" : "member"];
}

export function watchlistDigestLimitForRole(
  tier: MembershipTier | null,
  role: "member" | "admin"
): number {
  if (role === "admin") return AI_WATCHLIST_DIGEST_MONTHLY_LIMIT.admin;
  return AI_WATCHLIST_DIGEST_MONTHLY_LIMIT[tier === "pro" ? "pro" : "member"];
}

export function helpAssistantLimitForRole(
  tier: MembershipTier | null,
  role: "member" | "admin"
): number {
  if (role === "admin") return AI_HELP_ASSISTANT_MONTHLY_LIMIT.admin;
  return AI_HELP_ASSISTANT_MONTHLY_LIMIT[tier === "pro" ? "pro" : "member"];
}

export function canUseHelpAssistant(
  tier: MembershipTier | null,
  role: "member" | "admin"
): boolean {
  return role === "admin" || tier === "pro";
}
