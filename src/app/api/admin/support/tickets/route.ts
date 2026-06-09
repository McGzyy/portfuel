import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { listAdminSupportTickets } from "@/lib/support/tickets";

export async function GET() {
  try {
    await requireAdmin();
    const tickets = await listAdminSupportTickets();
    return NextResponse.json({ tickets });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/support/tickets GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
