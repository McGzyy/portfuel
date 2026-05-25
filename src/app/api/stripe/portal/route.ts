import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe/config";
import { createBillingPortalSession } from "@/lib/stripe/checkout";
import { findUserById } from "@/lib/stripe/subscription";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const user = await findUserById(session.userId);
    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: "no_billing_account" }, { status: 400 });
    }

    const url = await createBillingPortalSession(user.stripe_customer_id);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[stripe/portal]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
