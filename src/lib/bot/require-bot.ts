import { NextResponse } from "next/server";

export function requireBotKey(request: Request): NextResponse | null {
  const expected = process.env.BOT_API_KEY;
  if (!expected) {
    return NextResponse.json({ error: "bot_key_unconfigured" }, { status: 500 });
  }
  const got = request.headers.get("x-portfuel-bot-key") ?? "";
  if (!got || got !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

