import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSessionPayloadForUser } from "@/lib/auth/session-lifecycle";
import { createSession, getSession } from "@/lib/auth/session";
import { confirmVerificationToken } from "@/lib/member-lifecycle/email-verify";
import { findUserById } from "@/lib/stripe/subscription";

const schema = z.object({
  token: z.string().min(16),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await confirmVerificationToken(body.token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const session = await getSession();
    if (session && session.userId === result.userId) {
      const user = await findUserById(result.userId);
      if (user) {
        await createSession(await buildSessionPayloadForUser(user));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
