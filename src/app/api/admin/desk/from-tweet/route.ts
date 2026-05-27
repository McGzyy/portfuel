import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { generateTweetDeskDraft } from "@/lib/ai/tweet-desk-draft";
import { extractTweetTickers } from "@/lib/social/tweet-parse";

const schema = z.object({
  rawText: z.string().min(12).max(8000),
  adminNote: z.string().max(500).optional(),
  chosenSymbol: z.string().max(12).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const result = await generateTweetDeskDraft({
      rawText: body.rawText,
      adminNote: body.adminNote,
      chosenSymbol: body.chosenSymbol,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      draft: result.draft,
      regexCandidates: extractTweetTickers(body.rawText),
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
    console.error("[admin/desk/from-tweet]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
