import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { isStripeConfigured, MEMBERSHIP_TIERS } from "@/lib/stripe/config";
import { createCheckoutSession } from "@/lib/stripe/checkout";
import { findUserById } from "@/lib/stripe/subscription";

const schema = z.object({
  tier: z.enum(["member", "pro"]),
  userId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  try {
    const body = schema.parse(await request.json());
    const session = await getSession();

    let userId = body.userId;

    if (session) {
      if (userId && userId !== session.userId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      userId = session.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!MEMBERSHIP_TIERS.includes(body.tier)) {
      return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    if (user.subscription_status === "active" && user.stripe_subscription_id) {
      return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
    }

    if (!session && user.subscription_status !== "pending") {
      return NextResponse.json({ error: "checkout_not_allowed" }, { status: 403 });
    }

    const { url, sessionId } = await createCheckoutSession({
      userId,
      tier: body.tier,
      customerEmail: user.email,
    });

    return NextResponse.json({ url, sessionId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error) {
      if (e.message === "already_subscribed") {
        return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
      }
      if (e.message === "user_not_found") {
        return NextResponse.json({ error: "user_not_found" }, { status: 404 });
      }
    }
    console.error("[stripe/checkout]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
