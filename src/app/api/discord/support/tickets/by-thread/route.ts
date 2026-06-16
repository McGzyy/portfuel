import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import { getSupportTicketByDiscordThread } from "@/lib/discord/support-tickets";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  const threadId = new URL(request.url).searchParams.get("threadId")?.trim();
  if (!threadId) {
    return NextResponse.json({ error: "thread_id_required" }, { status: 400 });
  }

  const ticket = await getSupportTicketByDiscordThread(threadId);
  if (!ticket) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      userId: ticket.user_id,
      subject: ticket.subject,
      status: ticket.status,
      category: ticket.category,
      username: ticket.username,
      displayName: ticket.display_name,
      discordThreadId: ticket.discord_thread_id,
    },
  });
}
