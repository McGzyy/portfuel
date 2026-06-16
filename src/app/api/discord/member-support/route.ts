import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  MEMBER_SUPPORT_HUB_CONTENT,
  MEMBER_SUPPORT_HUB_LEGACY_MARKERS,
  MEMBER_SUPPORT_HUB_MARKER,
  buildMemberSupportHubEmbeds,
} from "@/lib/discord/support-tickets";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    ok: true,
    markerTitle: MEMBER_SUPPORT_HUB_MARKER,
    legacyMarkerTitles: MEMBER_SUPPORT_HUB_LEGACY_MARKERS,
    content: MEMBER_SUPPORT_HUB_CONTENT,
    embeds: buildMemberSupportHubEmbeds(getAppUrl()),
  });
}
