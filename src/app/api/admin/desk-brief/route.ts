import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { fetchDeskBriefForAdmin, updateDeskBrief } from "@/lib/desk/brief";

export async function GET() {
  try {
    await requireAdmin();
    const brief = await fetchDeskBriefForAdmin();
    return NextResponse.json(brief);
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[admin/desk-brief GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  weeklyNote: z.string().max(2000).nullable().optional(),
  pinnedCallId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = patchSchema.parse(await request.json());
    const result = await updateDeskBrief({
      weeklyNote: body.weeklyNote,
      pinnedCallId: body.pinnedCallId,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const brief = await fetchDeskBriefForAdmin();
    return NextResponse.json({ ok: true, ...brief });
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
    console.error("[admin/desk-brief PATCH]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
