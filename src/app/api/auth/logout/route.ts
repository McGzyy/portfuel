import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth/session";
import { revokeAuthSession } from "@/lib/auth/auth-sessions";

async function logout() {
  const session = await getSession();
  if (session?.sessionId && session.sessionId !== "demo") {
    try {
      await revokeAuthSession(session.sessionId, session.userId);
    } catch {
      /* best effort */
    }
  }
  await destroySession();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}

export async function POST() {
  return logout();
}

export async function GET() {
  return logout();
}
