import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { getThreadDetail, sendDirectMessage } from "@/lib/messages/service";

const sendSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { threadId } = await context.params;
    const thread = await getThreadDetail(session.userId, threadId);
    if (!thread) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ thread });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[messages/thread GET]", e);
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
    const body = sendSchema.parse(await request.json());
    const result = await sendDirectMessage({
      senderId: session.userId,
      threadId,
      body: body.body,
    });
    if ("error" in result) {
      const status =
        result.error === "forbidden"
          ? 403
          : result.error === "invalid_body"
            ? 400
            : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ message: result.message });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[messages/thread POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
