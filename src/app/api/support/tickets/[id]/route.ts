import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveMember } from "@/lib/auth/session";
import {
  getSupportTicketForMember,
  updateSupportTicketStatus,
} from "@/lib/support/tickets";

const memberCloseStatuses = ["resolved", "closed"] as const;

const patchSchema = z.object({
  status: z.enum(memberCloseStatuses),
});

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { id } = await params;
    const body = patchSchema.parse(await request.json());

    const existing = await getSupportTicketForMember(id, session.userId);
    if (!existing) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await updateSupportTicketStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[support/tickets/[id] PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
