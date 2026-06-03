import { NextResponse } from "next/server";
import { previewReferrer } from "@/lib/referrals/service";
import { isReferralProgramEnabled, refereeDiscountLabel } from "@/lib/referrals/config";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ valid: false });
  }

  const referrer = await previewReferrer(code);
  if (!referrer) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    ...referrer,
    refereeOffer:
      isReferralProgramEnabled() ? refereeDiscountLabel() : null,
  });
}
