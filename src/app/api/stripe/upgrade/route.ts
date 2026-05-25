import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/stripe/subscription";
import { isStripeConfigured } from "@/lib/stripe/config";
import { upgradeMemberToPro } from "@/lib/stripe/upgrade";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { tier } = await upgradeMemberToPro(session.userId);
    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    await createSession({
      userId: session.userId,
      username: session.username,
      displayName: session.displayName,
      role: session.role,
      subscriptionStatus: "active",
      membershipTier: tier,
      totpVerified: session.totpVerified,
    });

    return NextResponse.json({ ok: true, tier });
  } catch (e) {
    if (e instanceof Error) {
      const code = e.message;
      if (
        code === "already_pro" ||
        code === "subscription_inactive" ||
        code === "no_stripe_subscription"
      ) {
        return NextResponse.json({ error: code }, { status: 409 });
      }
      if (code === "user_not_found") {
        return NextResponse.json({ error: code }, { status: 404 });
      }
    }
    console.error("[stripe/upgrade]", e);
    return NextResponse.json({ error: "upgrade_failed" }, { status: 500 });
  }
}
