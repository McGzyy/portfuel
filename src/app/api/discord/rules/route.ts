import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  RULES_LEGACY_MARKER_TITLES,
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
    legacyMarkerTitles: RULES_LEGACY_MARKER_TITLES,
    content: buildRulesMessageContent(appUrl),
    embeds: buildRulesEmbeds(appUrl),
  });
}
