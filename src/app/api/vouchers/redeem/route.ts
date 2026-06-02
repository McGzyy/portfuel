import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { sessionCookieOptions, signSessionToken } from "@/lib/auth/session-sync";
import { createServiceClient } from "@/lib/db/supabase";
import { findReferrerByCode } from "@/lib/referrals/service";
import { effectiveMembershipTier } from "@/lib/billing/effective-access";
import { redeemProTrialVoucher } from "@/lib/vouchers/service";

const schema = z.object({
  code: z.string().min(3).max(64),
  referralCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = schema.parse(await request.json());
    let referrerId: string | null = null;
    if (body.referralCode) {
      const referrer = await findReferrerByCode(body.referralCode);
      referrerId = referrer?.id ?? null;
    } else {
      const db = createServiceClient();
      const { data } = await db
        .from("users")
        .select("referred_by_user_id")
        .eq("id", session.userId)
        .maybeSingle();
      referrerId = (data?.referred_by_user_id as string | null) ?? null;
    }

    const { proGrantedUntil } = await redeemProTrialVoucher({
      code: body.code,
      userId: session.userId,
      referrerId,
    });

    const db = createServiceClient();
    const { data: row } = await db
      .from("users")
      .select("subscription_status, membership_tier, pro_granted_until, totp_verified, display_name, role, onboarding_completed_at")
      .eq("id", session.userId)
      .maybeSingle();

    const effectiveTier = effectiveMembershipTier(
      row?.membership_tier ?? session.membershipTier,
      proGrantedUntil
    );

    const updated = {
      ...session,
      membershipTier: effectiveTier,
      proGrantedUntil,
    };

    const token = await signSessionToken(updated);
    const jar = await cookies();
    jar.set("portfuel_session", token, sessionCookieOptions());

    return NextResponse.json({
      ok: true,
      proGrantedUntil,
      membershipTier: effectiveTier,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error) {
      const known = [
        "not_found",
        "inactive",
        "expired",
        "max_uses",
        "already_pro",
        "not_member",
        "wrong_kind",
        "affiliate_required",
      ];
      if (known.includes(e.message)) {
        return NextResponse.json({ error: e.message }, { status: 400 });
      }
    }
    console.error("[vouchers/redeem]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
