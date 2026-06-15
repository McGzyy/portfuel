import { NextResponse } from "next/server";
import {
  DEMO_TIER_COOKIE,
  parseDemoPreviewTier,
  type DemoPreviewTier,
} from "@/lib/demo/tier";

export async function POST(request: Request) {
  let tier: DemoPreviewTier = "member";
  try {
    const body = (await request.json()) as { tier?: string };
    tier = parseDemoPreviewTier(body.tier);
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const res = NextResponse.json({ tier });
  res.cookies.set(DEMO_TIER_COOKIE, tier, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
