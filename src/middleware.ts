import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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

type JwtPayload = {
  userId?: string;
  username?: string;
  pin?: string;
  role?: string;
  subscriptionStatus?: string;
  totpVerified?: boolean;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = (await verifySession(token)) as JwtPayload | null;
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const sub = String(payload.subscriptionStatus ?? "");
    const role = String(payload.role ?? "");
    const totpVerified = Boolean(payload.totpVerified);
    const isActive = sub === "active" || role === "admin";

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      sub !== "active" &&
      role !== "admin" &&
      !pathname.startsWith("/onboarding") &&
      pathname !== "/join"
    ) {
      return NextResponse.redirect(new URL("/join?pending=1", request.url));
    }

    if (
      isActive &&
      !totpVerified &&
      pathname !== twoFactorSetupPath &&
      !pathname.startsWith("/api/")
    ) {
      return NextResponse.redirect(new URL(twoFactorSetupPath, request.url));
    }

    if (totpVerified && pathname === twoFactorSetupPath) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname === "/login" && token) {
    const payload = await verifySession(token);
    if (payload) {
      const totpVerified = Boolean(payload.totpVerified);
      const sub = String(payload.subscriptionStatus ?? "");
      const role = String(payload.role ?? "");
      const isActive = sub === "active" || role === "admin";

      if (isActive && !totpVerified) {
        return NextResponse.redirect(new URL(twoFactorSetupPath, request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
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
