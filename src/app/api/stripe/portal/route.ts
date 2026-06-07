import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe/config";
import { createBillingPortalSession } from "@/lib/stripe/checkout";
import { findUserById } from "@/lib/stripe/subscription";

const bodySchema = z.object({
  cancelFlow: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = bodySchema.safeParse(await request.json().catch(() => ({})));
    const cancelFlow = body.success ? body.data.cancelFlow : false;

    const user = await findUserById(session.userId);
    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: "no_billing_account" }, { status: 400 });
    }

    const url = await createBillingPortalSession(user.stripe_customer_id, { cancelFlow });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[stripe/portal]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
