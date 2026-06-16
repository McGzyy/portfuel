import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  OFFICIAL_LINKS_MARKER_TITLE,
  OFFICIAL_LINKS_MESSAGE_CONTENT,
  buildOfficialLinksEmbeds,
} from "@/lib/discord/official-links-content";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    ok: true,
    markerTitle: OFFICIAL_LINKS_MARKER_TITLE,
    content: OFFICIAL_LINKS_MESSAGE_CONTENT,
    embeds: buildOfficialLinksEmbeds(getAppUrl()),
  });
}
