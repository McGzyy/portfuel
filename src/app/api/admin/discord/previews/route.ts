import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { buildAdminDiscordPreviews } from "@/lib/discord/admin-previews";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET() {
  try {
    await requireAdmin();
    const data = buildAdminDiscordPreviews(getAppUrl());
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[admin/discord/previews]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
