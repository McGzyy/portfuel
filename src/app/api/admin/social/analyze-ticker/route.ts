import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { analyzeTickerFromPost } from "@/lib/ai/ticker-analyze";

const schema = z.object({
  rawText: z.string().min(12).max(8000),
  tweetUrl: z.string().url().max(500).nullable().optional(),
  symbol: z.string().min(1).max(12),
  inPostSnippet: z.string().max(500).optional(),
  adminNote: z.string().max(500).optional(),
  assetClass: z.enum(["equity", "crypto"]).optional(),
  mode: z.enum(["default", "deep"]).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const result = await analyzeTickerFromPost({
      rawText: body.rawText,
      tweetUrl: body.tweetUrl ?? null,
      symbol: body.symbol,
      inPostSnippet: body.inPostSnippet,
      adminNote: body.adminNote,
      assetClass: body.assetClass,
      mode: body.mode ?? "default",
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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
    console.error("[admin/social/analyze-ticker]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
