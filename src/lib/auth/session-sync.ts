import { SignJWT } from "jose";
import { createServiceClient } from "@/lib/db/supabase";
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
  totp_verified: boolean;
  display_name: string | null;
  role: SessionPayload["role"];
};

async function fetchBillingRow(userId: string): Promise<DbBillingRow | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("subscription_status, membership_tier, totp_verified, display_name, role")
    .eq("id", userId)
    .maybeSingle();
  return data as DbBillingRow | null;
}

function sessionChanged(before: SessionPayload, after: SessionPayload): boolean {
  return (
    before.subscriptionStatus !== after.subscriptionStatus ||
    before.membershipTier !== after.membershipTier ||
    before.totpVerified !== after.totpVerified ||
    before.role !== after.role ||
    before.displayName !== after.displayName
  );
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
    totpVerified: Boolean(payload.totpVerified),
  };
}

export async function refreshSessionFromDatabase(
  session: SessionPayload
): Promise<{ session: SessionPayload; token?: string }> {
  try {
    const row = await fetchBillingRow(session.userId);
    if (!row) return { session };

    const merged: SessionPayload = {
      ...session,
      subscriptionStatus: row.subscription_status,
      membershipTier: row.membership_tier ?? null,
      totpVerified: row.totp_verified,
      displayName: row.display_name ?? session.displayName,
      role: row.role,
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
