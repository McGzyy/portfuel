import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { getSupportTicketForMember } from "@/lib/support/tickets";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { id } = await params;
    const result = await getSupportTicketForMember(id, session.userId);
    if (!result) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[support/tickets/[id] GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
