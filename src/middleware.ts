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
import { shouldApplyMemberAppearance } from "@/lib/appearance/routes";
import {
  APPEARANCE_COOKIE,
  serializeAppearanceCookie,
} from "@/lib/appearance/cookie";

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
    const jwtIssuedAt = typeof payload.iat === "number" ? payload.iat : undefined;
    const { session, token: freshToken } = await refreshSessionFromDatabase(base, {
      jwtIssuedAt,
    });
    return { session, freshToken };
  }

  /** Client-side navigations: trust the signed JWT and skip Supabase session sync. */
  async function resolveSessionLight(): Promise<{
    session: SessionPayload | null;
  }> {
    if (!token) return { session: null };
    const payload = await verifySession(token);
    if (!payload) return { session: null };
    const base = jwtPayloadToSession(payload);
    if (!base) return { session: null };
    return { session: base };
  }

  function isSoftNavigationRequest(request: NextRequest): boolean {
    const accept = request.headers.get("accept");
    if (accept?.includes("text/x-component")) return true;
    if (request.headers.get("RSC") === "1") return true;
    if (request.headers.get("Next-Router-Prefetch") === "1") return true;
    return false;
  }

  async function resolveSessionForRequest(request: NextRequest): Promise<{
    session: SessionPayload | null;
    freshToken?: string;
  }> {
    if (isSoftNavigationRequest(request)) {
      return resolveSessionLight();
    }
    return resolveSession();
  }

  function withFreshCookie(res: NextResponse, freshToken?: string, session?: SessionPayload | null) {
    if (freshToken) {
      res.cookies.set(COOKIE_NAME, freshToken, sessionCookieOptions());
    }
    if (session && shouldApplyMemberAppearance(pathname, true)) {
      res.cookies.set(APPEARANCE_COOKIE, serializeAppearanceCookie(session), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  }

  function withAppearanceRequest(
    request: NextRequest,
    session: SessionPayload | null
  ): Headers {
    const requestHeaders = new Headers(request.headers);
    if (session && shouldApplyMemberAppearance(pathname, true)) {
      requestHeaders.set("x-pf-appearance", "1");
      requestHeaders.set("x-pf-theme-mode", session.themeMode);
      requestHeaders.set("x-pf-icon-theme", session.iconTheme);
    }
    return requestHeaders;
  }

  function nextWithSession(
    request: NextRequest,
    session: SessionPayload | null,
    freshToken?: string
  ) {
    return withFreshCookie(
      NextResponse.next({ request: { headers: withAppearanceRequest(request, session) } }),
      freshToken,
      session
    );
  }

  if (isProtected || isLifecycle) {
    const { session, freshToken } = await resolveSessionForRequest(request);
    if (!session) {
      const loginRedirect = NextResponse.redirect(new URL("/login", request.url));
      if (token) {
        loginRedirect.cookies.delete(COOKIE_NAME);
      }
      if (isLifecycle && pathname.startsWith(emailVerifyPath)) {
        return loginRedirect;
      }
      return loginRedirect;
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
        pathname.startsWith("/dashboard/settings") ||
        pathname === "/join" ||
        pathname.startsWith("/join/");

      if (sub === "cancelled") {
        if (!onBillingPath && isProtected) {
          return withFreshCookie(
            NextResponse.redirect(new URL("/dashboard/settings", request.url)),
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
      return withFreshCookie(
        NextResponse.redirect(new URL(memberHomePath(session), request.url)),
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

    return nextWithSession(request, session, freshToken);
  }

  if (pathname === "/" && token) {
    const { session, freshToken } = await resolveSessionForRequest(request);
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
    const { session, freshToken } = await resolveSessionForRequest(request);
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

  if (token && shouldApplyMemberAppearance(pathname, true)) {
    const { session, freshToken } = await resolveSessionForRequest(request);
    if (session) {
      return nextWithSession(request, session, freshToken);
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
    "/ticker/:path*",
    "/verify-email",
    "/verify-email/:path*",
    "/account/restricted",
    "/account/banned",
    "/join/success",
    "/login",
  ],
};
