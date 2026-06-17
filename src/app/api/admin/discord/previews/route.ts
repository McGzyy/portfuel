import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { buildAdminDiscordPreviews } from "@/lib/discord/admin-previews";
import { fetchSocialPostCopy } from "@/lib/social/copy-templates";
import { getAppUrl } from "@/lib/stripe/config";

export async function GET() {
  try {
    await requireAdmin();
    const copy = await fetchSocialPostCopy();
    const data = buildAdminDiscordPreviews(getAppUrl(), copy);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[admin/discord/previews]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
