import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotKey } from "@/lib/bot/require-bot";
import { resolveDiscordTicketAuthor } from "@/lib/discord/support-tickets";
import { getSupportTicketAdmin, postSupportTicketMessage } from "@/lib/support/tickets";

const schema = z.object({
  discordUserId: z.string().min(1),
  body: z.string().trim().min(1).max(8000),
  discordStaff: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = schema.parse(await request.json());

    const detail = await getSupportTicketAdmin(id);
    if (!detail) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const author = await resolveDiscordTicketAuthor({
      discordUserId: body.discordUserId,
      ticketUserId: detail.ticket.user_id,
      discordStaff: body.discordStaff,
    });
    if (!author.ok) {
      return NextResponse.json({ error: "forbidden", message: author.reason }, { status: 403 });
    }

    const { messageId } = await postSupportTicketMessage({
      ticketId: id,
      authorUserId: author.userId,
      authorRole: author.role,
      body: body.body,
      skipDiscordChannelSync: true,
    });

    return NextResponse.json({ ok: true, messageId, authorRole: author.role });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "ticket_closed") {
      return NextResponse.json({ error: "ticket_closed" }, { status: 409 });
    }
    console.error("[discord/support/tickets/reply POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
