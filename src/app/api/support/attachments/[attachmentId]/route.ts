import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import { getSupportAttachmentForDownload } from "@/lib/support/attachments";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  try {
    const session = await requireActiveMember();
    const { attachmentId } = await params;

    const result = await getSupportAttachmentForDownload({
      attachmentId,
      userId: session.userId,
      role: session.role,
    });

    if (!result) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.redirect(result.signedUrl);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[support/attachments GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
