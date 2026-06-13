import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import {
  isMemberAvatarsEnabled,
  removeMemberAvatar,
  uploadMemberAvatar,
  validateMemberAvatarFile,
} from "@/lib/users/member-avatar";

export async function POST(request: Request) {
  try {
    const session = await requireSession();

    if (!isMemberAvatarsEnabled()) {
      return NextResponse.json({ error: "avatars_unavailable" }, { status: 503 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const validation = validateMemberAvatarFile({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });
    if (validation) {
      return NextResponse.json({ error: "invalid_file", message: validation }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const avatarUrl = await uploadMemberAvatar({
      userId: session.userId,
      contentType: file.type || "image/jpeg",
      data: buffer,
    });

    return NextResponse.json({ ok: true, avatarUrl });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[auth/profile/avatar POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireSession();

    if (!isMemberAvatarsEnabled()) {
      return NextResponse.json({ error: "avatars_unavailable" }, { status: 503 });
    }

    await removeMemberAvatar(session.userId);
    return NextResponse.json({ ok: true, avatarUrl: null });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[auth/profile/avatar DELETE]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
