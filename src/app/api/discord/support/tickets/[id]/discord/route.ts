import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotKey } from "@/lib/bot/require-bot";
import { saveSupportTicketDiscordChannel } from "@/lib/discord/support-tickets";

const schema = z.object({
  guildId: z.string().min(1),
  channelId: z.string().min(1),
  rootMessageId: z.string().min(1),
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
    await saveSupportTicketDiscordChannel({
      ticketId: id,
      guildId: body.guildId,
      channelId: body.channelId,
      rootMessageId: body.rootMessageId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/support/tickets/discord POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
