import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { generateTotpSecret, getTotpQrDataUrl } from "@/lib/auth/totp";

export async function GET() {
  try {
    const session = await requireSession();

    if (session.subscriptionStatus !== "active" && session.role !== "admin") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }

    if (session.totpVerified) {
      return NextResponse.json({ error: "already_configured" }, { status: 400 });
    }

    const secret = generateTotpSecret();
    const qr = await getTotpQrDataUrl(secret, session.username);

    return NextResponse.json({ secret, qr });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[auth/2fa-setup]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
