import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { encryptSecret } from "@/lib/auth/crypto";
import { requireSession, createSession } from "@/lib/auth/session";
import { verifyTotpToken } from "@/lib/auth/totp";

const schema = z.object({
  token: z.string().min(6).max(8),
  totpSecret: z.string().min(16),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());

    if (session.subscriptionStatus !== "active" && session.role !== "admin") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }

    if (session.totpVerified) {
      return NextResponse.json({ error: "already_configured" }, { status: 400 });
    }

    if (!(await verifyTotpToken(body.totpSecret, body.token))) {
      return NextResponse.json({ error: "invalid_totp" }, { status: 400 });
    }

    const db = createServiceClient();
    const { error } = await db
      .from("users")
      .update({
        totp_secret_enc: encryptSecret(body.totpSecret),
        totp_verified: true,
      } as never)
      .eq("id", session.userId);

    if (error) {
      console.error("[auth/2fa-complete]", error);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    await createSession({
      ...session,
      totpVerified: true,
      onboardingCompleted: session.onboardingCompleted,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[auth/2fa-complete]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
