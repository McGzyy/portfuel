import type { SessionPayload } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/config";
import type { MembershipTier } from "@/lib/stripe/config";

export type ProAccessContext = {
  role: SessionPayload["role"];
  subscriptionStatus: SessionPayload["subscriptionStatus"];
  membershipTier?: MembershipTier | null;
} | null;

export function sessionToProContext(
  session: SessionPayload | null
): ProAccessContext {
  if (!session) return null;
  return {
    role: session.role,
    subscriptionStatus: session.subscriptionStatus,
    membershipTier: session.membershipTier ?? null,
  };
}

/** Force gated UI for demos (founder preview of paywall). */
export function isProGatePreviewMode(): boolean {
  return process.env.NEXT_PUBLIC_PRO_GATES_PREVIEW === "true";
}

/**
 * Pro intelligence: market intel stack, advanced feed analytics, leaderboard depth.
 * Requires active subscription + Pro Intelligence tier (or admin / demo).
 */
export function canAccessProIntelligence(ctx: ProAccessContext): boolean {
  if (isProGatePreviewMode()) return false;
  if (!ctx) return false;
  if (ctx.role === "admin") return true;
  if (isDemoMode()) return true;
  if (process.env.NEXT_PUBLIC_PRO_INTEL_UNLOCK === "true") {
    return ctx.subscriptionStatus === "active";
  }
  if (ctx.subscriptionStatus !== "active") return false;
  return ctx.membershipTier === "pro";
}

export function isProIntelligenceLocked(ctx: ProAccessContext): boolean {
  return !canAccessProIntelligence(ctx);
}
