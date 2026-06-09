import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import type { UserRow } from "@/lib/db/types";
import { decryptSecret } from "@/lib/auth/crypto";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit, recordAuthAttempt } from "@/lib/auth/rate-limit";
import { buildSessionPayloadForUser } from "@/lib/auth/session-lifecycle";
import { isEmailVerificationRequired } from "@/lib/member-lifecycle/config";
import { establishSession } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/username";
import { verifyTotpToken } from "@/lib/auth/totp";
import { needsOnboarding } from "@/lib/onboarding/service";

const schema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(1).max(128),
  token: z
    .string()
    .optional()
    .transform((v) => {
      const clean = v?.replace(/\s/g, "") ?? "";
      return clean.length > 0 ? clean : undefined;
    })
    .refine((v) => v === undefined || /^\d{6,8}$/.test(v), {
      message: "invalid_token",
    }),
});

async function passwordMatches(input: string, hash: string): Promise<boolean> {
  const trimmed = input.trim();
  if (await verifyPassword(trimmed, hash)) return true;
  if (trimmed !== input && (await verifyPassword(input, hash))) return true;
  return false;
}

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

    if (!(await passwordMatches(body.password, user.password_hash))) {
      await recordAuthAttempt(username, ip, false);
      return NextResponse.json({ error: "invalid_password" }, { status: 401 });
    }

    if ((user as UserRow & { banned_at?: string | null }).banned_at) {
      await recordAuthAttempt(username, ip, false);
      return NextResponse.json({ error: "account_banned" }, { status: 403 });
    }

    const isActive =
      user.subscription_status === "active" || user.role === "admin";

    if (user.totp_verified) {
      if (!body.token) {
        return NextResponse.json({ error: "totp_required", requiresTotp: true }, { status: 401 });
      }
      if (!user.totp_secret_enc) {
        return NextResponse.json({ error: "totp_setup_error" }, { status: 503 });
      }
      let secret: string;
      try {
        secret = decryptSecret(user.totp_secret_enc);
      } catch (e) {
        console.error("[auth/login] TOTP decrypt failed for", username, e);
        return NextResponse.json({ error: "totp_setup_error" }, { status: 503 });
      }
      if (!(await verifyTotpToken(secret, body.token))) {
        return NextResponse.json({ error: "invalid_totp" }, { status: 401 });
      }
    }

    await recordAuthAttempt(username, ip, true);

    await establishSession(
      await buildSessionPayloadForUser(user, {
        onboardingCompleted: !needsOnboarding(user),
      }),
      {
        userAgent: request.headers.get("user-agent") ?? undefined,
        ip,
      }
    );

    const needsOnboardingWizard =
      isActive && user.totp_verified && needsOnboarding(user);

    const extended = user as UserRow & { email_verified_at?: string | null };
    const needsEmailVerification =
      isActive &&
      isEmailVerificationRequired() &&
      !extended.email_verified_at &&
      user.role !== "admin";

    return NextResponse.json({
      ok: true,
      needsDisplayName: !user.display_name,
      needsOnboarding: needsOnboardingWizard,
      needsTwoFactorSetup: isActive && !user.totp_verified,
      needsEmailVerification,
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
