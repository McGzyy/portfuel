import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  createAnnouncement,
  listAnnouncementsAdmin,
} from "@/lib/announcements/service";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  severity: z.enum(["info", "warning", "success"]).optional(),
  audience: z.enum(["all", "member", "pro"]).optional(),
  linkUrl: z.string().url().max(500).nullable().optional(),
  linkLabel: z.string().max(80).nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const announcements = await listAnnouncementsAdmin();
    return NextResponse.json({ announcements });
  } catch (e) {
    return adminError(e);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = createSchema.parse(await request.json());
    const announcement = await createAnnouncement(
      {
        title: body.title,
        body: body.body,
        severity: body.severity ?? "info",
        audience: body.audience ?? "all",
        linkUrl: body.linkUrl,
        linkLabel: body.linkLabel,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
      },
      session.userId
    );
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
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
  console.error("[admin/announcements]", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
