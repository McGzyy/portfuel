import { NextResponse } from "next/server";
import { requireBotKey } from "@/lib/bot/require-bot";
import { createServiceClient } from "@/lib/db/supabase";
import { getDiscordConfig } from "@/lib/discord/config";
import { listMemberSupportTickets } from "@/lib/support/tickets";
import { formatTicketRef, supportStatusLabel } from "@/lib/support/types";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  const discordUserId = new URL(request.url).searchParams.get("discordUserId")?.trim();
  if (!discordUserId) {
    return NextResponse.json({ error: "discord_user_id_required" }, { status: 400 });
  }

  const cfg = getDiscordConfig();
  const db = createServiceClient();
  const { data: link } = await db
    .from("discord_accounts")
    .select("user_id")
    .eq("discord_user_id", discordUserId)
    .eq("guild_id", cfg.guildId)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "not_linked" }, { status: 403 });
  }

  const tickets = await listMemberSupportTickets(String(link.user_id), 15);
  const open = tickets.filter((t) => t.status !== "closed" && t.status !== "resolved");
  const appUrl = getAppUrl().replace(/\/$/, "");

  return NextResponse.json({
    ok: true,
    tickets: open.map((t) => ({
      id: t.id,
      ref: formatTicketRef(t.ticket_number),
      subject: t.subject,
      status: supportStatusLabel(t.status),
      url: `${appUrl}/dashboard/help?view=tickets&ticket=${t.id}`,
      discordChannelId: t.discord_channel_id ?? null,
    })),
  });
}
