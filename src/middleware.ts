import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  jwtPayloadToSession,
  refreshSessionFromDatabase,
  sessionCookieOptions,
} from "@/lib/auth/session-sync";
import type { SessionPayload } from "@/lib/auth/session-types";

const COOKIE_NAME = "portfuel_session";

const protectedPaths = [
  "/dashboard",
  "/calls",
  "/onboarding",
  "/profile",
  "/member",
  "/admin",
  "/security",
];

const twoFactorSetupPath = "/security/2fa";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return new TextEncoder().encode("dev-session-secret-min-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  async function resolveSession(): Promise<{
    session: SessionPayload | null;
    freshToken?: string;
  }> {
    if (!token) return { session: null };
    const payload = await verifySession(token);
    if (!payload) return { session: null };
    const base = jwtPayloadToSession(payload);
    if (!base) return { session: null };
    const { session, token: freshToken } = await refreshSessionFromDatabase(base);
    return { session, freshToken };
  }

  function withFreshCookie(res: NextResponse, freshToken?: string) {
    if (freshToken) {
      res.cookies.set(COOKIE_NAME, freshToken, sessionCookieOptions());
    }
    return res;
  }

  if (isProtected) {
    const { session, freshToken } = await resolveSession();
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const sub = session.subscriptionStatus;
    const role = session.role;
    const totpVerified = session.totpVerified;
    const isActive = sub === "active" || role === "admin";

    if (pathname.startsWith("/admin") && role !== "admin") {
      return withFreshCookie(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        freshToken
      );
    }

    if (
      sub !== "active" &&
      role !== "admin" &&
      !pathname.startsWith("/onboarding") &&
      pathname !== "/join"
    ) {
      return withFreshCookie(
        NextResponse.redirect(new URL("/join?pending=1", request.url)),
        freshToken
      );
    }

    if (
      isActive &&
      !totpVerified &&
      pathname !== twoFactorSetupPath &&
      !pathname.startsWith("/api/")
    ) {
      return withFreshCookie(
        NextResponse.redirect(new URL(twoFactorSetupPath, request.url)),
        freshToken
      );
    }

    if (totpVerified && pathname === twoFactorSetupPath) {
      return withFreshCookie(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        freshToken
      );
    }

    return withFreshCookie(NextResponse.next(), freshToken);
  }

  if (pathname === "/login" && token) {
    const { session, freshToken } = await resolveSession();
    if (session) {
      const totpVerified = session.totpVerified;
      const sub = session.subscriptionStatus;
      const role = session.role;
      const isActive = sub === "active" || role === "admin";

      if (isActive && !totpVerified) {
        return withFreshCookie(
          NextResponse.redirect(new URL(twoFactorSetupPath, request.url)),
          freshToken
        );
      }
      return withFreshCookie(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        freshToken
      );
    }
  }

  return NextResponse.next();
}

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calls/:path*",
    "/onboarding",
    "/profile/:path*",
    "/admin/:path*",
    "/security/:path*",
    "/login",
  ],
};
