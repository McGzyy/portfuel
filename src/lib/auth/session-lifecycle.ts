import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { appearanceFromUserRow } from "@/lib/appearance/prefs";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import type { SessionPayload } from "@/lib/auth/session-types";
import { clearExpiredModeration, flagsFromRow } from "@/lib/member-lifecycle/moderation";
import { isEmailVerificationRequired } from "@/lib/member-lifecycle/config";

export type LifecycleSessionFields = {
  emailVerified: boolean;
  banned: boolean;
  canAccessWorkspace: boolean;
  canPublishCalls: boolean;
  canDm: boolean;
  canComment: boolean;
};

export async function fetchLifecycleSessionFields(
  userId: string
): Promise<LifecycleSessionFields> {
  await clearExpiredModeration(userId);

  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select(
      "email_verified_at, banned_at, can_access_workspace, can_publish_calls, can_dm, can_comment, moderation_expires_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!data) {
    return {
      emailVerified: !isEmailVerificationRequired(),
      banned: false,
      canAccessWorkspace: true,
      canPublishCalls: true,
      canDm: true,
      canComment: true,
    };
  }

  const flags = flagsFromRow(data as Parameters<typeof flagsFromRow>[0]);
  const emailVerified =
    Boolean(data.email_verified_at) || !isEmailVerificationRequired();

  return {
    emailVerified,
    banned: flags.banned,
    canAccessWorkspace: flags.banned ? false : flags.canAccessWorkspace,
    canPublishCalls: flags.banned ? false : flags.canPublishCalls,
    canDm: flags.banned ? false : flags.canDm,
    canComment: flags.banned ? false : flags.canComment,
  };
}

export async function buildSessionPayloadForUser(
  user: UserRow,
  opts?: { onboardingCompleted?: boolean }
): Promise<SessionPayload> {
  const lifecycle = await fetchLifecycleSessionFields(user.id);
  const extended = user as UserRow & {
    pro_granted_until?: string | null;
    onboarding_completed_at?: string | null;
  };

  return {
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    subscriptionStatus: user.subscription_status,
    membershipTier: effectiveMembershipTier(
      user.membership_tier,
      extended.pro_granted_until
    ),
    proGrantedUntil: extended.pro_granted_until ?? null,
    ...lifecycle,
    totpVerified: user.totp_verified,
    onboardingCompleted:
      opts?.onboardingCompleted ??
      (user.role === "admin" || Boolean(extended.onboarding_completed_at)),
    ...appearanceFromUserRow(
      user as UserRow & { theme_mode?: string | null; icon_theme?: string | null }
    ),
  };
}
