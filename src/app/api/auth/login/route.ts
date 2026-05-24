import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { decryptSecret } from "@/lib/auth/crypto";
import { checkRateLimit, recordAuthAttempt } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { verifyTotpToken } from "@/lib/auth/totp";

const schema = z.object({
  pin: z.string().regex(/^[0-9]{5}$/),
  token: z.string().min(6).max(8),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!(await checkRateLimit(body.pin, ip))) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const db = createServiceClient();
    const { data: userRaw, error } = await db
      .from("users")
      .select("*")
      .eq("pin", body.pin)
      .maybeSingle();

    const user = userRaw as UserRow | null;

    if (error || !user || !user.totp_secret_enc || !user.totp_verified) {
      await recordAuthAttempt(body.pin, ip, false);
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const secret = decryptSecret(user.totp_secret_enc);
    if (!(await verifyTotpToken(secret, body.token))) {
      await recordAuthAttempt(body.pin, ip, false);
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    await recordAuthAttempt(body.pin, ip, true);

    await createSession({
      userId: user.id,
      pin: user.pin,
      role: user.role,
      subscriptionStatus: user.subscription_status,
    });

    return NextResponse.json({
      ok: true,
      needsDisplayName: !user.display_name,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[auth/login]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
