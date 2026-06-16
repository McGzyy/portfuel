import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  VERIFICATION_LEGACY_MARKER_TITLES,
  VERIFICATION_MARKER_TITLE,
  buildVerificationEmbed,
} from "@/lib/discord/verification-content";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    ok: true,
    markerTitle: VERIFICATION_MARKER_TITLE,
    legacyMarkerTitles: VERIFICATION_LEGACY_MARKER_TITLES,
    embeds: [buildVerificationEmbed(getAppUrl())],
  });
}
