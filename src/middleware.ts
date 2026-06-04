import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  jwtPayloadToSession,
  refreshSessionFromDatabase,
  sessionCookieOptions,
} from "@/lib/auth/session-sync";
import { memberHomePath } from "@/lib/auth/member-home";
import type { SessionPayload } from "@/lib/auth/session-types";

const COOKIE_NAME = "portfuel_session";

const protectedPaths = [
  "/dashboard",
  "/calls",
  "/onboarding",
  "/profile",
  "/settings",
  "/member",
  "/admin",
  "/security",
  "/notifications",
];

const emailVerifyPath = "/verify-email";
const accountRestrictedPath = "/account/restricted";
const accountBannedPath = "/account/banned";
const twoFactorSetupPath = "/security/2fa";

const sessionLifecyclePrefixes = [
  emailVerifyPath,
  accountRestrictedPath,
  twoFactorSetupPath,
  "/join/success",
];

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return new TextEncoder().encode("dev-session-secret-min-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

function isLifecyclePath(pathname: string): boolean {
  return sessionLifecyclePrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function needsEmailGate(session: SessionPayload): boolean {
  return session.role !== "admin" && !session.emailVerified;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isLifecycle = isLifecyclePath(pathname);

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

  if (isProtected || isLifecycle) {
    const { session, freshToken } = await resolveSession();
    if (!session) {
      if (isLifecycle && pathname.startsWith(emailVerifyPath)) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.banned) {
      return withFreshCookie(
        NextResponse.redirect(new URL(accountBannedPath, request.url)),
        freshToken
      );
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

    if (sub !== "active" && role !== "admin") {
      const onBillingPath =
        pathname.startsWith("/profile") ||
        pathname.startsWith("/settings") ||
        pathname === "/join" ||
        pathname.startsWith("/join/");

      if (sub === "cancelled") {
        if (!onBillingPath && isProtected) {
          return withFreshCookie(
            NextResponse.redirect(new URL("/settings", request.url)),
            freshToken
          );
        }
      } else if (
        isProtected &&
        pathname !== "/join" &&
        !pathname.startsWith("/join/")
      ) {
        return withFreshCookie(
          NextResponse.redirect(new URL("/join?pending=1", request.url)),
          freshToken
        );
      }
    }

    if (isActive && needsEmailGate(session)) {
      const onVerify =
        pathname === emailVerifyPath || pathname.startsWith(`${emailVerifyPath}/`);
      if (!onVerify && (isProtected || pathname === twoFactorSetupPath)) {
        return withFreshCookie(
          NextResponse.redirect(new URL(emailVerifyPath, request.url)),
          freshToken
        );
      }
    }

    if (
      isActive &&
      session.emailVerified &&
      pathname === emailVerifyPath
    ) {
      const dest = !totpVerified ? twoFactorSetupPath : memberHomePath(session);
      return withFreshCookie(NextResponse.redirect(new URL(dest, request.url)), freshToken);
    }

    if (
      isActive &&
      session.emailVerified &&
      !totpVerified &&
      pathname !== twoFactorSetupPath &&
      !pathname.startsWith("/api/") &&
      (isProtected || pathname.startsWith("/join/success"))
    ) {
      return withFreshCookie(
        NextResponse.redirect(new URL(twoFactorSetupPath, request.url)),
        freshToken
      );
    }

    if (totpVerified && pathname === twoFactorSetupPath) {
      const dest =
        isActive && role !== "admin" && !session.onboardingCompleted
          ? "/onboarding"
          : "/dashboard";
      return withFreshCookie(NextResponse.redirect(new URL(dest, request.url)), freshToken);
    }

    if (
      isActive &&
      totpVerified &&
      session.emailVerified &&
      !session.canAccessWorkspace &&
      role !== "admin" &&
      isProtected
    ) {
      const onProfile =
        pathname.startsWith("/profile") || pathname.startsWith("/settings");
      if (!onProfile) {
        return withFreshCookie(
          NextResponse.redirect(new URL(accountRestrictedPath, request.url)),
          freshToken
        );
      }
    }

    if (
      isActive &&
      totpVerified &&
      role !== "admin" &&
      !session.onboardingCompleted &&
      !pathname.startsWith("/onboarding") &&
      isProtected &&
      session.canAccessWorkspace
    ) {
      return withFreshCookie(
        NextResponse.redirect(new URL("/onboarding", request.url)),
        freshToken
      );
    }

    if (pathname.startsWith("/onboarding") && session.onboardingCompleted) {
      return withFreshCookie(
        NextResponse.redirect(new URL("/dashboard", request.url)),
        freshToken
      );
    }

    return withFreshCookie(NextResponse.next(), freshToken);
  }

  if (pathname === "/" && token) {
    const { session, freshToken } = await resolveSession();
    if (session) {
      if (session.banned) {
        return withFreshCookie(
          NextResponse.redirect(new URL(accountBannedPath, request.url)),
          freshToken
        );
      }
      if (needsEmailGate(session) && session.subscriptionStatus === "active") {
        return withFreshCookie(
          NextResponse.redirect(new URL(emailVerifyPath, request.url)),
          freshToken
        );
      }
      return withFreshCookie(
        NextResponse.redirect(new URL(memberHomePath(session), request.url)),
        freshToken
      );
    }
  }

  if (pathname === "/login" && token) {
    const { session, freshToken } = await resolveSession();
    if (session && !session.banned) {
      const sub = session.subscriptionStatus;
      const role = session.role;
      const isActive = sub === "active" || role === "admin";

      if (isActive && needsEmailGate(session)) {
        return withFreshCookie(
          NextResponse.redirect(new URL(emailVerifyPath, request.url)),
          freshToken
        );
      }

      if (isActive && !session.totpVerified) {
        return withFreshCookie(
          NextResponse.redirect(new URL(twoFactorSetupPath, request.url)),
          freshToken
        );
      }

      if (
        isActive &&
        !session.canAccessWorkspace &&
        role !== "admin"
      ) {
        return withFreshCookie(
          NextResponse.redirect(new URL(accountRestrictedPath, request.url)),
          freshToken
        );
      }

      const dest =
        isActive && role !== "admin" && !session.onboardingCompleted
          ? "/onboarding"
          : "/dashboard";
      return withFreshCookie(
        NextResponse.redirect(new URL(dest, request.url)),
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
    "/",
    "/dashboard/:path*",
    "/calls/:path*",
    "/onboarding",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
    "/member/:path*",
    "/admin/:path*",
    "/security/:path*",
    "/notifications",
    "/verify-email",
    "/verify-email/:path*",
    "/account/restricted",
    "/account/banned",
    "/join/success",
    "/login",
  ],
};
