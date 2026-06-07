import { SignJWT } from "jose";
import { createServiceClient } from "@/lib/db/supabase";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import { fetchLifecycleSessionFields } from "@/lib/auth/session-lifecycle";
import { expireProGrantIfNeeded } from "@/lib/billing/pro-grant";
import { expireCompAccessIfNeeded } from "@/lib/billing/comp-access";
import type { MembershipTier } from "@/lib/stripe/config";
import type { SessionPayload } from "@/lib/auth/session-types";

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
  subscription_status: SessionPayload["subscriptionStatus"];
  membership_tier: MembershipTier | null;
  pro_granted_until: string | null;
  totp_verified: boolean;
  display_name: string | null;
  role: SessionPayload["role"];
  onboarding_completed_at: string | null;
};

async function fetchBillingRow(userId: string): Promise<DbBillingRow | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select(
      "subscription_status, membership_tier, pro_granted_until, totp_verified, display_name, role, onboarding_completed_at"
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
    before.displayName !== after.displayName ||
    before.onboardingCompleted !== after.onboardingCompleted ||
    before.emailVerified !== after.emailVerified ||
    before.banned !== after.banned ||
    before.canAccessWorkspace !== after.canAccessWorkspace
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
  };
}

export async function refreshSessionFromDatabase(
  session: SessionPayload
): Promise<{ session: SessionPayload; token?: string }> {
  try {
    await expireProGrantIfNeeded(session.userId);
    await expireCompAccessIfNeeded(session.userId);
    const row = await fetchBillingRow(session.userId);
    if (!row) return { session };

    void touchLastActive(session.userId);

    const effectiveTier = effectiveMembershipTier(
      row.membership_tier,
      row.pro_granted_until
    );

    const lifecycle = await fetchLifecycleSessionFields(session.userId);

    const merged: SessionPayload = {
      ...session,
      subscriptionStatus: row.subscription_status,
      membershipTier: effectiveTier,
      proGrantedUntil: row.pro_granted_until,
      ...lifecycle,
      totpVerified: row.totp_verified,
      displayName: row.display_name ?? session.displayName,
      role: row.role,
      onboardingCompleted: onboardingCompletedFromRow(row),
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
