import type { SessionPayload } from "@/lib/auth/session";
import { effectiveHasProIntelligence } from "@/lib/billing/effective-access";
import { isDemoMode } from "@/lib/demo/config";
import type { MembershipTier } from "@/lib/stripe/config";

export type ProAccessContext = {
  role: SessionPayload["role"];
  subscriptionStatus: SessionPayload["subscriptionStatus"];
  membershipTier?: MembershipTier | null;
  proGrantedUntil?: string | null;
} | null;

export function sessionToProContext(
  session: SessionPayload | null
): ProAccessContext {
  if (!session) return null;
  return {
    role: session.role,
    subscriptionStatus: session.subscriptionStatus,
    membershipTier: session.membershipTier ?? null,
    proGrantedUntil: session.proGrantedUntil ?? null,
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
  return effectiveHasProIntelligence({
    role: ctx.role,
    subscriptionStatus: ctx.subscriptionStatus,
    membershipTier: ctx.membershipTier ?? null,
    proGrantedUntil: ctx.proGrantedUntil,
  });
}

export function isProIntelligenceLocked(ctx: ProAccessContext): boolean {
  return !canAccessProIntelligence(ctx);
}

export type ProGateCta = "join" | "upgrade" | "checkout";

/** CTA for locked Pro intelligence surfaces. */
export function getProGateCta(ctx: ProAccessContext): ProGateCta {
  if (!ctx) return "join";
  if (ctx.role === "admin") return "upgrade";
  if (ctx.subscriptionStatus === "pending") return "checkout";
  if (ctx.subscriptionStatus === "active" && ctx.membershipTier === "member") {
    return "upgrade";
  }
  return "join";
}
