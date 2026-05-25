import type { SessionPayload } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/config";

export type ProAccessContext = {
  role: SessionPayload["role"];
  subscriptionStatus: SessionPayload["subscriptionStatus"];
} | null;

export function sessionToProContext(
  session: SessionPayload | null
): ProAccessContext {
  if (!session) return null;
  return {
    role: session.role,
    subscriptionStatus: session.subscriptionStatus,
  };
}

/** Force gated UI for demos (founder preview of paywall). */
export function isProGatePreviewMode(): boolean {
  return process.env.NEXT_PUBLIC_PRO_GATES_PREVIEW === "true";
}

/**
 * Pro intelligence: market intel stack, advanced feed analytics, leaderboard depth.
 * Today = active members; later = Stripe Pro tier on top of base membership.
 */
export function canAccessProIntelligence(ctx: ProAccessContext): boolean {
  if (isProGatePreviewMode()) return false;
  if (!ctx) return false;
  if (ctx.role === "admin") return true;
  if (isDemoMode()) return true;
  return ctx.subscriptionStatus === "active";
}

export function isProIntelligenceLocked(ctx: ProAccessContext): boolean {
  return !canAccessProIntelligence(ctx);
}
