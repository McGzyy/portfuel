import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { listAuthSessions } from "@/lib/auth/auth-sessions";

export async function GET() {
  try {
    const session = await requireActiveMember();
    const sessions = await listAuthSessions(session.userId, session.sessionId);
    return NextResponse.json({
      sessions,
      totpVerified: session.totpVerified,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[auth/sessions GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
