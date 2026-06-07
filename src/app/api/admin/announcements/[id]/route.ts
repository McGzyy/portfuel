import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  deleteAnnouncement,
  updateAnnouncement,
} from "@/lib/announcements/service";

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  body: z.string().min(1).max(2000).optional(),
  severity: z.enum(["info", "warning", "success"]).optional(),
  audience: z.enum(["all", "member", "pro"]).optional(),
  linkUrl: z.string().url().max(500).nullable().optional(),
  linkLabel: z.string().max(80).nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    const announcement = await updateAnnouncement(id, {
      title: body.title,
      body: body.body,
      severity: body.severity,
      audience: body.audience,
      linkUrl: body.linkUrl,
      linkLabel: body.linkLabel,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      isActive: body.isActive,
    });
    if (!announcement) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ announcement });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    return adminError(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteAnnouncement(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return adminError(e);
  }
}

function adminError(e: unknown) {
  if (e instanceof Error && e.message === "unauthorized") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (e instanceof Error && e.message === "forbidden") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  console.error("[admin/announcements/id]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
