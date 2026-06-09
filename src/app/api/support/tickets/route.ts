import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import { createSupportTicket, listMemberSupportTickets } from "@/lib/support/tickets";
const createSchema = z.object({
  category: z.enum(["billing", "account", "calls", "technical", "other"]),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(8000),
});

export async function GET() {
  try {
    const session = await requireActiveMember();
    const tickets = await listMemberSupportTickets(session.userId);
    return NextResponse.json({ tickets });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[support/tickets GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireActiveMember();
    const body = createSchema.parse(await request.json());
    const result = await createSupportTicket({
      userId: session.userId,
      category: body.category,
      subject: body.subject,
      message: body.message,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[support/tickets POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
