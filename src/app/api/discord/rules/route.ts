import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  RULES_MARKER_TITLE,
  buildRulesEmbeds,
  buildRulesMessageContent,
} from "@/lib/discord/rules-content";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  const appUrl = getAppUrl();
  return NextResponse.json({
    ok: true,
    markerTitle: RULES_MARKER_TITLE,
    content: buildRulesMessageContent(appUrl),
    embeds: buildRulesEmbeds(appUrl),
  });
}
