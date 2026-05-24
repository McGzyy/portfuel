import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "portfuel_session";

export type SessionPayload = {
  userId: string;
  pin: string;
  role: "member" | "admin";
  subscriptionStatus: "pending" | "active" | "cancelled";
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

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: String(payload.userId),
      pin: String(payload.pin),
      role: payload.role as SessionPayload["role"],
      subscriptionStatus: payload.subscriptionStatus as SessionPayload["subscriptionStatus"],
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
  return session;
}
