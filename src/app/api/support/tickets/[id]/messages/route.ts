import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { postSupportTicketMessage } from "@/lib/support/tickets";

const bodySchema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { id } = await params;
    const body = bodySchema.parse(await request.json());

    await postSupportTicketMessage({
      ticketId: id,
      authorUserId: session.userId,
      authorRole: "member",
      body: body.body,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "ticket_not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "ticket_closed") {
      return NextResponse.json({ error: "ticket_closed" }, { status: 409 });
    }
    console.error("[support/tickets/messages POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
