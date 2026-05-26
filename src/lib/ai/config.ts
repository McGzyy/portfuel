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

export function isAiCoachConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key?.startsWith("sk-"));
}

export function getAiModelId(): string {
  return process.env.AI_COACH_MODEL?.trim() || "gpt-4o-mini";
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
