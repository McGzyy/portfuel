import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getMemberToProUpgradePreview } from "@/lib/stripe/upgrade-preview";

export async function GET() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const preview = await getMemberToProUpgradePreview(session.userId);
    return NextResponse.json(preview);
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
    console.error("[stripe/upgrade-preview]", e);
    return NextResponse.json({ error: "preview_failed" }, { status: 500 });
  }
}
