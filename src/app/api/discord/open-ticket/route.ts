import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  OPEN_TICKET_HUB_CONTENT,
  OPEN_TICKET_HUB_MARKER,
  buildOpenTicketHubEmbeds,
} from "@/lib/discord/open-ticket-content";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    ok: true,
    markerTitle: OPEN_TICKET_HUB_MARKER,
    content: OPEN_TICKET_HUB_CONTENT,
    embeds: buildOpenTicketHubEmbeds(getAppUrl()),
  });
}
