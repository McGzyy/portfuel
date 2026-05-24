import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "portfuel_session";

const protectedPaths = ["/dashboard", "/calls", "/onboarding", "/profile"];

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return new TextEncoder().encode("dev-session-secret-min-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

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
    const payload = await verifySession(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const sub = String(payload.subscriptionStatus ?? "");
    const role = String(payload.role ?? "");
    if (
      sub !== "active" &&
      role !== "admin" &&
      !pathname.startsWith("/onboarding") &&
      pathname !== "/join"
    ) {
      return NextResponse.redirect(new URL("/join?pending=1", request.url));
    }
  }

  if (pathname === "/login" && token) {
    const payload = await verifySession(token);
    if (payload) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/calls/:path*", "/onboarding", "/profile/:path*", "/login"],
};
