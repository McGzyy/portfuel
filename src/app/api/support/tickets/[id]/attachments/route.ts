import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import {
  uploadSupportAttachment,
  validateSupportAttachmentFile,
  isSupportAttachmentsEnabled,
} from "@/lib/support/attachments";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { id: ticketId } = await params;

    if (!isSupportAttachmentsEnabled()) {
      return NextResponse.json({ error: "attachments_unavailable" }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const messageIdRaw = form.get("messageId");
    const messageId =
      typeof messageIdRaw === "string" && messageIdRaw.trim() ? messageIdRaw.trim() : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const validation = validateSupportAttachmentFile({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });
    if (validation) {
      return NextResponse.json({ error: "invalid_file", message: validation }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const attachment = await uploadSupportAttachment({
      ticketId,
      messageId,
      userId: session.userId,
      role: session.role,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      byteSize: file.size,
      data: buffer,
    });

    return NextResponse.json({ ok: true, attachment });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "ticket_not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "ticket_closed") {
      return NextResponse.json({ error: "ticket_closed" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "attachment_limit") {
      return NextResponse.json({ error: "attachment_limit" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "invalid_file") {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }
    console.error("[support/tickets/attachments POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
