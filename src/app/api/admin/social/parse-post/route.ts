import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { parseSocialPost } from "@/lib/social/parse-post";

const schema = z
  .object({
    url: z.string().max(500).optional(),
    rawText: z.string().max(8000).optional(),
  })
  .refine((v) => Boolean(v.url?.trim() || v.rawText?.trim()), {
    message: "url_or_text_required",
  });

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const result = await parseSocialPost({
      url: body.url,
      rawText: body.rawText,
    });

    if ("error" in result) {
      const status =
        result.error === "text_too_short" || result.error === "invalid_url" ? 400 : 502;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
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
    console.error("[admin/social/parse-post]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
