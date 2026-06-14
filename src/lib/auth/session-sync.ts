import { SignJWT } from "jose";
import { createServiceClient } from "@/lib/db/supabase";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import { fetchLifecycleSessionFields } from "@/lib/auth/session-lifecycle";
import { expireProGrantIfNeeded } from "@/lib/billing/pro-grant";
import { expireCompAccessIfNeeded } from "@/lib/billing/comp-access";
import { parseIconTheme, parseThemeMode } from "@/lib/appearance/types";
import type { MembershipTier } from "@/lib/stripe/config";
import type { SessionPayload } from "@/lib/auth/session-types";
import {
  isAuthSessionValid,
  touchAuthSession,
} from "@/lib/auth/auth-sessions";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be at least 32 characters");
    }
    return new TextEncoder().encode("dev-session-secret-min-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

type DbBillingRow = {
  username: string;
  subscription_status: SessionPayload["subscriptionStatus"];
  membership_tier: MembershipTier | null;
  pro_granted_until: string | null;
  totp_verified: boolean;
  display_name: string | null;
  role: SessionPayload["role"];
  onboarding_completed_at: string | null;
  theme_mode: string | null;
  icon_theme: string | null;
};

async function fetchBillingRow(userId: string): Promise<DbBillingRow | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select(
      "username, subscription_status, membership_tier, pro_granted_until, totp_verified, display_name, role, onboarding_completed_at, theme_mode, icon_theme"
    )
    .eq("id", userId)
    .maybeSingle();
  return data as DbBillingRow | null;
}

async function touchLastActive(userId: string): Promise<void> {
  try {
    const db = createServiceClient();
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    await db
      .from("users")
      .update({ last_active_at: new Date().toISOString() } as never)
      .eq("id", userId)
      .or(`last_active_at.is.null,last_active_at.lt.${cutoff}`);
  } catch {
    /* best effort */
  }
}

function sessionChanged(before: SessionPayload, after: SessionPayload): boolean {
  return (
    before.subscriptionStatus !== after.subscriptionStatus ||
    before.membershipTier !== after.membershipTier ||
    before.proGrantedUntil !== after.proGrantedUntil ||
    before.totpVerified !== after.totpVerified ||
    before.role !== after.role ||
    before.userId !== after.userId ||
    before.authUserId !== after.authUserId ||
    before.username !== after.username ||
    before.displayName !== after.displayName ||
    before.emailVerified !== after.emailVerified ||
    before.banned !== after.banned ||
    before.canAccessWorkspace !== after.canAccessWorkspace ||
    before.themeMode !== after.themeMode ||
    before.iconTheme !== after.iconTheme
  );
}

function onboardingCompletedFromRow(row: DbBillingRow): boolean {
  return row.role === "admin" || Boolean(row.onboarding_completed_at);
}

/** Align JWT billing fields with Supabase (Stripe webhooks, portal, admin). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function jwtPayloadToSession(payload: Record<string, unknown>): SessionPayload | null {
  const userId = payload.userId ? String(payload.userId) : "";
  if (!userId) return null;
  const membershipTier = payload.membershipTier
    ? (String(payload.membershipTier) as MembershipTier)
    : null;
  return {
    userId,
    authUserId: payload.authUserId ? String(payload.authUserId) : userId,
    username: String(payload.username ?? payload.pin ?? ""),
    displayName: payload.displayName ? String(payload.displayName) : null,
    role: payload.role as SessionPayload["role"],
    subscriptionStatus: payload.subscriptionStatus as SessionPayload["subscriptionStatus"],
    membershipTier,
    proGrantedUntil: payload.proGrantedUntil ? String(payload.proGrantedUntil) : null,
    emailVerified: Boolean(payload.emailVerified),
    banned: Boolean(payload.banned),
    canAccessWorkspace: payload.canAccessWorkspace !== false,
    canPublishCalls: payload.canPublishCalls !== false,
    canDm: payload.canDm !== false,
    canComment: payload.canComment !== false,
    totpVerified: Boolean(payload.totpVerified),
    onboardingCompleted: Boolean(payload.onboardingCompleted),
    themeMode: parseThemeMode(payload.themeMode),
    iconTheme: parseIconTheme(payload.iconTheme),
    sessionId: payload.sessionId ? String(payload.sessionId) : undefined,
    sessionVersion:
      payload.sessionVersion !== undefined && payload.sessionVersion !== null
        ? Number(payload.sessionVersion)
        : undefined,
  };
}

const SESSION_DB_REFRESH_INTERVAL_SEC = 90;

export type RefreshSessionOptions = {
  /** Skip Supabase billing/lifecycle sync when the JWT was issued recently. */
  jwtIssuedAt?: number;
  force?: boolean;
};

export async function refreshSessionFromDatabase(
  session: SessionPayload,
  options?: RefreshSessionOptions
): Promise<{ session: SessionPayload | null; token?: string }> {
  try {
    const authUserId = session.authUserId ?? session.userId;
    const valid = await isAuthSessionValid({
      userId: authUserId,
      sessionId: session.sessionId,
      sessionVersion: session.sessionVersion,
    });
    if (!valid) {
      return { session: null };
    }

    const issuedAt = options?.jwtIssuedAt;
    if (
      !options?.force &&
      typeof issuedAt === "number" &&
      Math.floor(Date.now() / 1000) - issuedAt < SESSION_DB_REFRESH_INTERVAL_SEC
    ) {
      if (session.sessionId) {
        void touchAuthSession(session.sessionId);
      }
      return { session };
    }

    await expireProGrantIfNeeded(session.userId);
    await expireCompAccessIfNeeded(session.userId);

    const activeRow = await fetchBillingRow(session.userId);
    if (!activeRow) return { session };

    const authRow =
      authUserId !== session.userId ? await fetchBillingRow(authUserId) : activeRow;
    if (!authRow) return { session };

    void touchLastActive(session.userId);
    if (session.sessionId) {
      void touchAuthSession(session.sessionId);
    }

    const effectiveTier = effectiveMembershipTier(
      activeRow.membership_tier,
      activeRow.pro_granted_until
    );

    const lifecycle = await fetchLifecycleSessionFields(session.userId);
    const adminAuth = authRow.role === "admin";

    const merged: SessionPayload = {
      ...session,
      authUserId,
      username: activeRow.username,
      subscriptionStatus: activeRow.subscription_status,
      membershipTier: effectiveTier,
      proGrantedUntil: activeRow.pro_granted_until,
      ...lifecycle,
      canAccessWorkspace: adminAuth ? true : lifecycle.canAccessWorkspace,
      totpVerified: authRow.totp_verified,
      displayName: activeRow.display_name ?? session.displayName,
      role: authRow.role,
      onboardingCompleted: onboardingCompletedFromRow(authRow),
      themeMode: parseThemeMode(activeRow.theme_mode),
      iconTheme: parseIconTheme(activeRow.icon_theme),
    };

    if (!sessionChanged(session, merged)) {
      return { session: merged };
    }

    const token = await signSessionToken(merged);
    return { session: merged, token };
  } catch {
    return { session };
  }
}
