import { NextResponse } from "next/server";
import { generateTotpSecret, getTotpQrDataUrl } from "@/lib/auth/totp";

export async function GET(request: Request) {
  const pin = new URL(request.url).searchParams.get("pin") ?? "00000";
  const secret = generateTotpSecret();
  const qr = await getTotpQrDataUrl(secret, pin);
  return NextResponse.json({ secret, qr });
}
