import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { decryptSecret } from "@/lib/auth/crypto";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, recordAuthAttempt } from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/username";
import { verifyTotpToken } from "@/lib/auth/totp";
import { needsOnboarding } from "@/lib/onboarding/service";

const schema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(1).max(128),
  token: z.string().min(6).max(8).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const username = normalizeUsername(body.username);
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    if (!(await checkRateLimit(username, ip))) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const db = createServiceClient();
    const { data: userRaw, error } = await db
      .from("users")
      .select("*")
      .ilike("username", username)
      .maybeSingle();

    const user = userRaw as UserRow | null;

    if (error || !user || !user.password_hash) {
      await recordAuthAttempt(username, ip, false);
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    if (!(await verifyPassword(body.password, user.password_hash))) {
      await recordAuthAttempt(username, ip, false);
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const isActive =
      user.subscription_status === "active" || user.role === "admin";

    if (user.totp_verified) {
      if (!body.token) {
        return NextResponse.json({ error: "totp_required", requiresTotp: true }, { status: 401 });
      }
      if (!user.totp_secret_enc) {
        await recordAuthAttempt(username, ip, false);
        return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
      }
      const secret = decryptSecret(user.totp_secret_enc);
      if (!(await verifyTotpToken(secret, body.token))) {
        await recordAuthAttempt(username, ip, false);
        return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
      }
    }

    await recordAuthAttempt(username, ip, true);

    await createSession({
      userId: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      subscriptionStatus: user.subscription_status,
      membershipTier: user.membership_tier ?? null,
      totpVerified: user.totp_verified,
      onboardingCompleted: !needsOnboarding(user),
    });

    const needsOnboardingWizard =
      isActive && user.totp_verified && needsOnboarding(user);

    return NextResponse.json({
      ok: true,
      needsDisplayName: !user.display_name,
      needsOnboarding: needsOnboardingWizard,
      needsTwoFactorSetup: isActive && !user.totp_verified,
      role: user.role,
      subscriptionStatus: user.subscription_status,
      membershipTier: user.membership_tier ?? null,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[auth/login]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
