import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  FAQS_MARKER_TITLE,
  FAQS_MESSAGE_CONTENT,
  buildFaqsEmbeds,
} from "@/lib/discord/faqs-content";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    ok: true,
    markerTitle: FAQS_MARKER_TITLE,
    content: FAQS_MESSAGE_CONTENT,
    embeds: buildFaqsEmbeds(getAppUrl()),
  });
}
