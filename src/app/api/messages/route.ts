import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { listThreads, openThreadWithUsername } from "@/lib/messages/service";

const openSchema = z.object({
  recipientUsername: z.string().min(2).max(32),
});

export async function GET() {
  try {
    const session = await requireActiveMember();
    const threads = await listThreads(session.userId);
    return NextResponse.json({ threads });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "totp_required") {
      return NextResponse.json({ error: "totp_required" }, { status: 403 });
    }
    console.error("[messages GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Open or create a 1:1 thread with another member. */
export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const body = openSchema.parse(await request.json());
    const result = await openThreadWithUsername(
      session.userId,
      body.recipientUsername
    );
    if ("error" in result) {
      const status =
        result.error === "user_not_found"
          ? 404
          : result.error === "self_message"
            ? 400
            : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ threadId: result.threadId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[messages POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
