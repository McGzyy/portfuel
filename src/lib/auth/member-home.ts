import type { SessionPayload } from "@/lib/auth/session-types";

/** Where signed-in users land from logo / marketing redirects. */
export function memberHomePath(session: SessionPayload): string {
  if (session.role === "admin") return "/dashboard";
  if (session.subscriptionStatus === "cancelled") return "/settings";
  if (session.subscriptionStatus !== "active") return "/join?pending=1";
  if (!session.totpVerified) return "/security/2fa";
  if (!session.onboardingCompleted) return "/onboarding";
  return "/dashboard";
}
