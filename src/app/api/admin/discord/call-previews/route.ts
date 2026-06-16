import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { milestonePostContent } from "@/lib/discord/call-embed-helpers";
import {
  buildFueledCallEmbed,
  buildMemberNewCallEmbed,
  buildMilestoneChatEmbed,
  buildTargetHitChannelEmbed,
  fueledCallPostContent,
  memberNewCallPostContent,
  targetHitPostContent,
} from "@/lib/discord/embed-payloads";
import { getAppUrl } from "@/lib/stripe/config";

const DEMO = {
  symbol: "NVDA",
  direction: "long" as const,
  username: "deskalpha",
  displayName: "Desk Alpha",
  thesis:
    "AI capex cycle intact. Pullback into prior breakout zone with volume drying up. Target prior high; stop below last swing low.",
  entryPrice: 118.42,
  targetPrice: 142.0,
  stopPrice: 109.5,
  returnPct: 18.6,
};

/** Admin-only JSON previews of Discord call alert embeds (no outbox send). */
export async function GET() {
  try {
    await requireAdmin();
    const appUrl = getAppUrl();
    const url = `${appUrl}/ticker/${DEMO.symbol}`;

    return NextResponse.json({
      ok: true,
      note: "Design previews — compare in Discord by pasting embed JSON or use Social tab charts for milestone images.",
      previews: [
        {
          id: "member_new_call",
          channel: "#member-calls",
          eventType: "call.created",
          content: memberNewCallPostContent(),
          embed: buildMemberNewCallEmbed({ ...DEMO, url, appUrl }),
        },
        {
          id: "fueled_new_call",
          channel: "#fueled-calls",
          eventType: "call.created.fueled",
          content: fueledCallPostContent(),
          embed: buildFueledCallEmbed({
            symbol: DEMO.symbol,
            direction: DEMO.direction,
            url,
            appUrl,
            displayName: "PortFuel Desk",
            thesis: DEMO.thesis,
            entryPrice: DEMO.entryPrice,
            targetPrice: DEMO.targetPrice,
            stopPrice: DEMO.stopPrice,
            returnPct: 4.2,
          }),
        },
        {
          id: "target_hit_channel",
          channel: "#targets-hit",
          eventType: "call.target_hit",
          content: targetHitPostContent(DEMO.symbol),
          attachChart: true,
          embed: buildTargetHitChannelEmbed({
            symbol: DEMO.symbol,
            direction: DEMO.direction,
            url,
            username: DEMO.username,
            displayName: DEMO.displayName,
            returnPct: 20.1,
            entryPrice: DEMO.entryPrice,
            targetPrice: DEMO.targetPrice,
            appUrl,
            isFueled: false,
          }),
        },
        {
          id: "milestone_25_chat",
          channel: "#member-chat / #pro-member-chat",
          eventType: "call.milestone.snippet",
          content: milestonePostContent("return_25", DEMO.symbol),
          attachChart: false,
          embed: buildMilestoneChatEmbed({
            symbol: DEMO.symbol,
            direction: DEMO.direction,
            url,
            milestone: "return_25",
            returnPct: 25.4,
            username: DEMO.username,
            displayName: DEMO.displayName,
            appUrl,
            isFueled: false,
            entryPrice: DEMO.entryPrice,
            targetPrice: DEMO.targetPrice,
          }),
        },
        {
          id: "fueled_milestone_25_chat",
          channel: "#member-chat",
          eventType: "call.milestone.snippet",
          content: milestonePostContent("return_25", DEMO.symbol),
          attachChart: true,
          embed: buildMilestoneChatEmbed({
            symbol: DEMO.symbol,
            direction: DEMO.direction,
            url,
            milestone: "return_25",
            returnPct: 27.8,
            username: "PortFuel Desk",
            displayName: "PortFuel Desk",
            appUrl,
            isFueled: true,
            entryPrice: DEMO.entryPrice,
            targetPrice: DEMO.targetPrice,
          }),
        },
      ],
    });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[admin/discord/call-previews]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
