import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  getSupportTicketAdmin,
  postSupportTicketMessage,
  updateSupportTicketStatus,
} from "@/lib/support/tickets";
import { SUPPORT_STATUSES } from "@/lib/support/types";

const patchSchema = z.object({
  status: z.enum(SUPPORT_STATUSES),
});

const messageSchema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const result = await getSupportTicketAdmin(id);
    if (!result) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/support/tickets/[id] GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    await updateSupportTicketStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/support/tickets/[id] PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = messageSchema.parse(await request.json());

    await postSupportTicketMessage({
      ticketId: id,
      authorUserId: session.userId,
      authorRole: "admin",
      body: body.body,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "ticket_closed") {
      return NextResponse.json({ error: "ticket_closed" }, { status: 409 });
    }
    console.error("[admin/support/tickets/[id] POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
