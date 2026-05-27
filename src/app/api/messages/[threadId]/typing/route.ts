import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { isOtherParticipantTyping, setDmTyping } from "@/lib/messages/service";

const bodySchema = z.object({
  typing: z.boolean(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { threadId } = await context.params;
    const typing = await isOtherParticipantTyping(session.userId, threadId);
    return NextResponse.json({ typing });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[messages/typing GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { threadId } = await context.params;
    const { typing } = bodySchema.parse(await request.json());
    const result = await setDmTyping(session.userId, threadId, typing);
    if ("error" in result) {
      const status = result.error === "forbidden" ? 403 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[messages/typing POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
