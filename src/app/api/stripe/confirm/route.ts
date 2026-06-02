import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSessionPayloadForUser } from "@/lib/auth/session-lifecycle";
import { isEmailVerificationRequired } from "@/lib/member-lifecycle/config";
import { createSession } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe/config";
import { confirmCheckoutSession } from "@/lib/stripe/webhooks";
import { needsOnboarding } from "@/lib/onboarding/service";

const schema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  try {
    const { sessionId } = schema.parse(await request.json());
    const { user, tier } = await confirmCheckoutSession(sessionId);

    await createSession(
      await buildSessionPayloadForUser(user, {
        onboardingCompleted: !needsOnboarding(user),
      })
    );

    const verifiedAt = (user as { email_verified_at?: string | null }).email_verified_at;
    const needsEmailVerification = isEmailVerificationRequired() && !verifiedAt;

    return NextResponse.json({
      ok: true,
      username: user.username,
      needsTwoFactorSetup: !user.totp_verified,
      needsEmailVerification,
      tier,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error) {
      if (e.message === "payment_incomplete") {
        return NextResponse.json({ error: "payment_incomplete" }, { status: 402 });
      }
    }
    console.error("[stripe/confirm]", e);
    return NextResponse.json({ error: "confirm_failed" }, { status: 500 });
  }
}
