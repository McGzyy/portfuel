import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { encryptSecret } from "@/lib/auth/crypto";
import { generateTotpSecret, verifyTotpToken } from "@/lib/auth/totp";

const schema = z.object({
  pin: z.string().regex(/^[0-9]{5}$/),
  displayName: z.string().min(2).max(32),
  token: z.string().min(6).max(8),
  totpSecret: z.string().min(16),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());

    if (!(await verifyTotpToken(body.totpSecret, body.token))) {
      return NextResponse.json({ error: "invalid_totp" }, { status: 400 });
    }

    const db = createServiceClient();
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("pin", body.pin)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "pin_taken" }, { status: 409 });
    }

    const { data: user, error } = await db
      .from("users")
      .insert({
        pin: body.pin,
        display_name: body.displayName.trim(),
        totp_secret_enc: encryptSecret(body.totpSecret),
        totp_verified: true,
        subscription_status: "active",
        submission_quota_week: 2,
      } as never)
      .select("id, pin")
      .single();

    if (error) {
      console.error("[auth/register]", error);
      return NextResponse.json({ error: "register_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId: user.id, pin: user.pin });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[auth/register]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
