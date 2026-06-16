import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotKey } from "@/lib/bot/require-bot";
import { createServiceClient } from "@/lib/db/supabase";
import { getDiscordConfig } from "@/lib/discord/config";
import { createSupportTicket } from "@/lib/support/tickets";

const schema = z.object({
  discordUserId: z.string().min(1),
  category: z.enum(["billing", "account", "calls", "technical", "other"]),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(8000),
});

export async function POST(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const body = schema.parse(await request.json());
    const cfg = getDiscordConfig();
    const db = createServiceClient();

    const { data: link } = await db
      .from("discord_accounts")
      .select("user_id, users!inner(subscription_status, role)")
      .eq("discord_user_id", body.discordUserId)
      .eq("guild_id", cfg.guildId)
      .maybeSingle();

    if (!link) {
      return NextResponse.json(
        { error: "not_linked", message: "Link PortFuel in #verification first." },
        { status: 403 }
      );
    }

    const usersRaw = (link as { users: unknown }).users;
    const user = (Array.isArray(usersRaw) ? usersRaw[0] : usersRaw) as {
      subscription_status: string;
      role: string;
    };

    const userId = String((link as { user_id: string }).user_id);
    const isActive = user.subscription_status === "active" || user.role === "admin";
    if (!isActive) {
      return NextResponse.json(
        { error: "not_active", message: "An active PortFuel membership is required for support tickets." },
        { status: 403 }
      );
    }

    const result = await createSupportTicket({
      userId,
      category: body.category,
      subject: body.subject,
      message: body.message,
    });

    return NextResponse.json({
      ok: true,
      id: result.id,
      ticketNumber: result.ticketNumber,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/support/tickets/create POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
