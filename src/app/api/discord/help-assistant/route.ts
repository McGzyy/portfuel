import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBotKey } from "@/lib/bot/require-bot";
import {
  DiscordHelpAssistantError,
  runDiscordHelpAssistant,
} from "@/lib/discord/help-assistant";

const bodySchema = z.object({
  guildId: z.string().min(1),
  discordUserId: z.string().min(1),
  question: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const body = bodySchema.parse(await request.json());
    const result = await runDiscordHelpAssistant(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof DiscordHelpAssistantError) {
      const status =
        e.code === "limit_reached"
          ? 429
          : e.code === "not_configured"
            ? 503
            : e.code === "invalid_input"
              ? 400
              : 403;
      return NextResponse.json({ error: e.code, message: e.message }, { status });
    }
    console.error("[discord/help-assistant]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
