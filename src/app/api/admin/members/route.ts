import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireAdmin();
    const db = createServiceClient();

    const { data, error } = await db
      .from("users")
      .select(
        "id, username, display_name, role, subscription_status, totp_verified, calls_count, rank_score, submission_quota_week, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[admin/members]", error);
      return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
    }

    return NextResponse.json({ members: data ?? [] });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/members]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
