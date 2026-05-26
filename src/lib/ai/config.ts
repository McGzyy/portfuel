import type { MembershipTier } from "@/lib/stripe/config";

export const AI_COACH_DISCLAIMER =
  "Educational thesis coaching only — not investment advice. AI can be wrong. You are responsible for your own trades.";

/** Monthly reviews per calendar month (UTC). */
export const AI_COACH_MONTHLY_LIMIT: Record<MembershipTier | "admin", number> = {
  member: 2,
  pro: 30,
  admin: 200,
};

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
