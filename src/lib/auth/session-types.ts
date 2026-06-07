import type { MembershipTier } from "@/lib/stripe/config";

export type SessionPayload = {
  userId: string;
  username: string;
  displayName: string | null;
  role: "member" | "admin";
  subscriptionStatus: "pending" | "active" | "cancelled";
  membershipTier?: MembershipTier | null;
  proGrantedUntil?: string | null;
  emailVerified: boolean;
  banned: boolean;
  canAccessWorkspace: boolean;
  canPublishCalls: boolean;
  canDm: boolean;
  canComment: boolean;
  totpVerified: boolean;
  onboardingCompleted: boolean;
  themeMode: "light" | "dark";
  iconTheme: "auto" | "dark" | "red" | "light";
};
