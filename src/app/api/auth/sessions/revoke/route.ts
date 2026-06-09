import { NextResponse } from "next/server";
import { z } from "zod";
import { destroySession, requireActiveMember } from "@/lib/auth/session";
import { revokeAllAuthSessions, revokeAuthSession } from "@/lib/auth/auth-sessions";

const bodySchema = z.object({
  sessionId: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const body = bodySchema.parse(await request.json());

    if (body.all) {
      await revokeAllAuthSessions(session.userId);
      await destroySession();
      return NextResponse.json({ ok: true, signedOut: true });
    }

    if (!body.sessionId) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    await revokeAuthSession(body.sessionId, session.userId);

    const signedOut = body.sessionId === session.sessionId;
    if (signedOut) {
      await destroySession();
    }

    return NextResponse.json({ ok: true, signedOut });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[auth/sessions/revoke POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
