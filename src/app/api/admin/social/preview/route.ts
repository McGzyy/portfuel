import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { composeXPost } from "@/lib/social/x-compose";
import { xConfigSummary } from "@/lib/social/x-config";

const schema = z.object({
  type: z.enum(["fueled", "leaderboard"]),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const composed = await composeXPost(body.type);
    if (!composed.ok) {
      return NextResponse.json({ error: composed.error }, { status: 404 });
    }
    return NextResponse.json({
      text: composed.text,
      refId: composed.refId,
      charCount: composed.text.length,
      config: xConfigSummary(),
    });
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
    console.error("[admin/social/preview]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ config: xConfigSummary() });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
