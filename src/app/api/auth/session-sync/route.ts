import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/** Explicit refresh after Stripe portal (getSession already syncs from DB). */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    subscriptionStatus: session.subscriptionStatus,
    membershipTier: session.membershipTier ?? null,
  });
}
