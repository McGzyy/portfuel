import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push/config";

export async function GET() {
  const configured = isPushConfigured();
  const publicKey = getVapidPublicKey();
  if (!configured || !publicKey) {
    return NextResponse.json({ configured: false, publicKey: null });
  }
  return NextResponse.json({ configured: true, publicKey });
}
