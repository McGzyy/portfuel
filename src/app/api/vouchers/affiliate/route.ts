import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/config";
import { ensureReferralCode } from "@/lib/referrals/service";
import { listAffiliateVouchersForUser } from "@/lib/vouchers/service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ vouchers: [] });
  }

  try {
    const referralCode = await ensureReferralCode(session.userId, session.username);
    const vouchers = await listAffiliateVouchersForUser(session.userId, referralCode);
    return NextResponse.json({ vouchers });
  } catch (e) {
    console.error("[vouchers/affiliate]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
