import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { listCancellationFeedbackAdmin } from "@/lib/billing/cancellation-feedback";

export async function GET() {
  try {
    await requireAdmin();
    const feedback = await listCancellationFeedbackAdmin();
    return NextResponse.json({ feedback });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/cancellation-feedback]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
