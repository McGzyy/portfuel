import type { MembershipTier } from "@/lib/stripe/config";

export type SessionPayload = {
  userId: string;
  username: string;
  displayName: string | null;
  role: "member" | "admin";
  subscriptionStatus: "pending" | "active" | "cancelled";
  membershipTier?: MembershipTier | null;
  totpVerified: boolean;
  onboardingCompleted: boolean;
};
