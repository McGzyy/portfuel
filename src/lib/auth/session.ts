import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/db/supabase";
import {
  refreshSessionFromDatabase,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/auth/session-sync";
import type { SessionPayload } from "@/lib/auth/session-types";
import type { MembershipTier } from "@/lib/stripe/config";

const COOKIE_NAME = "portfuel_session";

export type { SessionPayload } from "@/lib/auth/session-types";

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

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, sessionCookieOptions());
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Old PIN-era cookies stored only `pin`; map to the real username from DB. */
async function resolveUsernameFromDb(
  userId: string,
  fallback: string
): Promise<{ username: string; displayName: string | null }> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("users")
      .select("username, display_name")
      .eq("id", userId)
      .maybeSingle();
    if (data?.username) {
      return {
        username: data.username,
        displayName: data.display_name ?? null,
      };
    }
  } catch {
    /* service client unavailable in some edge cases */
  }
  return { username: fallback, displayName: null };
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const cookieToken = jar.get(COOKIE_NAME)?.value;
  if (!cookieToken) return null;

  try {
    const { payload } = await jwtVerify(cookieToken, getSecret());
    let username = String(payload.username ?? payload.pin ?? "");
    let displayName = payload.displayName ? String(payload.displayName) : null;
    const userId = String(payload.userId);

    // Pre–username/password sessions stored the old PIN as username or only in `pin`.
    const legacyPinHandle = /^\d{5}$/.test(username);
    if (legacyPinHandle || (!payload.username && payload.pin)) {
      const resolved = await resolveUsernameFromDb(userId, username);
      username = resolved.username;
      displayName = displayName ?? resolved.displayName;
    }

    const membershipTier = payload.membershipTier
      ? (String(payload.membershipTier) as MembershipTier)
      : null;

    const base: SessionPayload = {
      userId,
      username,
      displayName,
      role: payload.role as SessionPayload["role"],
      subscriptionStatus: payload.subscriptionStatus as SessionPayload["subscriptionStatus"],
      membershipTier,
      proGrantedUntil: payload.proGrantedUntil ? String(payload.proGrantedUntil) : null,
      emailVerified: payload.emailVerified !== false,
      banned: Boolean(payload.banned),
      canAccessWorkspace: payload.canAccessWorkspace !== false,
      canPublishCalls: payload.canPublishCalls !== false,
      canDm: payload.canDm !== false,
      canComment: payload.canComment !== false,
      totpVerified: Boolean(payload.totpVerified),
      onboardingCompleted: Boolean(payload.onboardingCompleted),
    };

    const { session: synced, token: freshToken } = await refreshSessionFromDatabase(base);
    if (freshToken) {
      const jar = await cookies();
      jar.set(COOKIE_NAME, freshToken, sessionCookieOptions());
    }
    return synced;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
  if (session.banned) {
    await destroySession();
    throw new Error("account_banned");
  }
  return session;
}

export async function requireActiveMember(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.subscriptionStatus !== "active" && session.role !== "admin") {
    throw new Error("subscription_inactive");
  }
  if (!session.totpVerified && session.role !== "admin") {
    throw new Error("totp_required");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("forbidden");
  return session;
}
