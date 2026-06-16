import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotKey } from "@/lib/bot/require-bot";
import { getSupportTicketAdmin } from "@/lib/support/tickets";
import { updateSupportTicketStatus } from "@/lib/support/tickets";

const schema = z.object({
  discordUserId: z.string().min(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    schema.parse(await request.json().catch(() => ({})));

    const detail = await getSupportTicketAdmin(id);
    if (!detail) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (detail.ticket.status === "closed" || detail.ticket.status === "resolved") {
      return NextResponse.json({ error: "already_closed" }, { status: 409 });
    }

    await updateSupportTicketStatus(id, "closed");
    return NextResponse.json({
      ok: true,
      ticketNumber: detail.ticket.ticket_number,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/support/tickets/close POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
