import type { MembershipTier } from "@/lib/stripe/config";

export type SessionPayload = {
  /** Active workspace identity (calls, profile, book). */
  userId: string;
  /** Logged-in account — differs from userId when admin switches to personal. */
  authUserId?: string;
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
  /** Per-login session row for security settings. */
  sessionId?: string;
  /** Matches users.session_version — bump invalidates all JWTs. */
  sessionVersion?: number;
};
