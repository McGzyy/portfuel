import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { generateDeskDraft } from "@/lib/ai/desk-draft";

const schema = z.object({
  kind: z.enum(["portfolio_thesis", "weekly_note"]),
  bullets: z.string().min(8).max(2000),
  symbol: z.string().max(12).optional(),
  direction: z.enum(["long", "short"]).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const result = await generateDeskDraft(body);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ text: result.text });
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
    console.error("[admin/desk-draft POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
