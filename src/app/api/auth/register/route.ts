import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/db/supabase";
import { generateUniquePin } from "@/lib/auth/pin";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { normalizeUsername, usernamePattern, validateUsername } from "@/lib/auth/username";
import { isEmailAvailableForSignup } from "@/lib/member-lifecycle/email-verify";
import { normalizeEmail } from "@/lib/member-lifecycle/tokens";
import { attributeReferral, findReferrerByCode } from "@/lib/referrals/service";
import { notifyDiscordGrowthSignup } from "@/lib/discord/admin-events";

const schema = z.object({
  username: z.string().min(3).max(32).regex(usernamePattern),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(32),
  email: z.string().email().max(254),
  acceptedTerms: z.boolean().refine((v) => v === true, { message: "terms_required" }),
  referralCode: z.string().min(2).max(32).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const username = normalizeUsername(body.username);
    const nameError = validateUsername(username);
    if (nameError) {
      return NextResponse.json({ error: "invalid_username", message: nameError }, { status: 400 });
    }
    const passError = validatePassword(body.password);
    if (passError) {
      return NextResponse.json({ error: "invalid_password", message: passError }, { status: 400 });
    }

    const db = createServiceClient();
    const { data: existing } = await db
      .from("users")
      .select("id")
      .ilike("username", username)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "username_taken" }, { status: 409 });
    }

    const email = normalizeEmail(body.email);
    if (!(await isEmailAvailableForSignup(email))) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }

    const pin = await generateUniquePin(db);
    const passwordHash = await hashPassword(body.password);

    const { data: user, error } = await db
      .from("users")
      .insert({
        pin,
        username,
        password_hash: passwordHash,
        display_name: body.displayName.trim(),
        email,
        referral_code: username,
        totp_verified: false,
        subscription_status: "pending",
        submission_quota_week: 2,
      } as never)
      .select("id, username")
      .single();

    if (error) {
      console.error("[auth/register]", error);
      return NextResponse.json({ error: "register_failed" }, { status: 500 });
    }

    if (body.referralCode) {
      const referrer = await findReferrerByCode(body.referralCode);
      if (referrer && referrer.id !== user.id) {
        await attributeReferral({
          referrerId: referrer.id,
          referredUserId: user.id,
          referralCode: body.referralCode,
        });
      }
    }

    void notifyDiscordGrowthSignup({
      username: user.username,
      displayName: body.displayName.trim(),
      referralCode: body.referralCode ?? null,
    }).catch((e) => console.error("[discord/growth-signup]", e));

    return NextResponse.json({ ok: true, userId: user.id, username: user.username });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("[auth/register]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
