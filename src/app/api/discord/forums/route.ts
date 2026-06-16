import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  FORUMS_MARKER_TITLE,
  FORUMS_MESSAGE_CONTENT,
  buildForumsEmbeds,
} from "@/lib/discord/forums-content";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    ok: true,
    markerTitle: FORUMS_MARKER_TITLE,
    content: FORUMS_MESSAGE_CONTENT,
    embeds: buildForumsEmbeds(getAppUrl()),
  });
}
