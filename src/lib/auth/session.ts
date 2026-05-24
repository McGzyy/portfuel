import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/db/supabase";

const COOKIE_NAME = "portfuel_session";

export type SessionPayload = {
  userId: string;
  username: string;
  displayName: string | null;
  role: "member" | "admin";
  subscriptionStatus: "pending" | "active" | "cancelled";
  totpVerified: boolean;
};

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
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
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
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
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

    return {
      userId,
      username,
      displayName,
      role: payload.role as SessionPayload["role"],
      subscriptionStatus: payload.subscriptionStatus as SessionPayload["subscriptionStatus"],
      totpVerified: Boolean(payload.totpVerified),
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
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
