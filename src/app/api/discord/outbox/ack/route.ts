import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { requireBotKey } from "@/lib/bot/require-bot";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["sent", "failed"]),
  error: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const unauthorized = requireBotKey(request);
  if (unauthorized) return unauthorized;

  try {
    const body = schema.parse(await request.json());
    const db = createServiceClient();
    const now = new Date().toISOString();

    const { error } = await db
      .from("discord_outbox")
      .update({
        status: body.status,
        processed_at: now,
        error: body.error ?? null,
      } as never)
      .eq("id", body.id);

    if (error) {
      return NextResponse.json({ error: "ack_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[discord/outbox/ack]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

