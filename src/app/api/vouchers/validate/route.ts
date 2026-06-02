import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/db/supabase";
import { findReferrerByCode } from "@/lib/referrals/service";
import type { MembershipTier } from "@/lib/stripe/config";
import {
  validateVoucherForCheckout,
  validateVoucherForProTrial,
} from "@/lib/vouchers/service";
import type { VoucherBillingInterval } from "@/lib/vouchers/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim() ?? "";
  const tier = (searchParams.get("tier") ?? "member") as MembershipTier;
  const kind = searchParams.get("kind") ?? "checkout_discount";
  const ref = searchParams.get("ref")?.trim() ?? "";
  const interval = (searchParams.get("interval") ?? "monthly") as VoucherBillingInterval;

  if (!code) {
    return NextResponse.json({ valid: false, error: "missing_code" }, { status: 400 });
  }

  const session = await getSession();
  let referrerId: string | null = null;

  if (ref) {
    const referrer = await findReferrerByCode(ref);
    referrerId = referrer?.id ?? null;
  } else if (session) {
    const db = createServiceClient();
    const { data } = await db
      .from("users")
      .select("referred_by_user_id")
      .eq("id", session.userId)
      .maybeSingle();
    referrerId = (data?.referred_by_user_id as string | null) ?? null;
  }

  if (kind === "pro_trial") {
    if (!session) {
      return NextResponse.json({ valid: false, error: "login_required" }, { status: 401 });
    }
    const db = createServiceClient();
    const { data: user } = await db.from("users").select("*").eq("id", session.userId).maybeSingle();
    if (!user) {
      return NextResponse.json({ valid: false, error: "user_not_found" }, { status: 404 });
    }
    const result = await validateVoucherForProTrial(code, user, referrerId);
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error });
    }
    return NextResponse.json({
      valid: true,
      kind: result.voucher.kind,
      label: result.voucher.label,
      proTrialDays: result.voucher.pro_trial_days,
    });
  }

  const result = await validateVoucherForCheckout(code, {
    userId: session?.userId,
    tier,
    billingInterval: interval,
    referrerId,
  });

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error });
  }

  const v = result.voucher;
  return NextResponse.json({
    valid: true,
    kind: v.kind,
    label: v.label,
    discountType: v.discount_type,
    discountPercent: v.discount_percent,
    discountAmountCents: v.discount_amount_cents,
    applicableTier: v.applicable_tier,
    applicableInterval: v.applicable_interval,
  });
}
