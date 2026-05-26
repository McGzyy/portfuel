import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { generateDeskDraft, generateDeskDraftFromHeadlines } from "@/lib/ai/desk-draft";
import { fetchDeskWeekResearch } from "@/lib/desk/research";

const schema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("bullets"),
    kind: z.enum(["portfolio_thesis", "weekly_note"]),
    bullets: z.string().min(8).max(4000),
    symbol: z.string().max(12).optional(),
    direction: z.enum(["long", "short"]).optional(),
  }),
  z.object({
    source: z.literal("headlines"),
    kind: z.enum(["portfolio_thesis", "weekly_note"]),
    symbol: z.string().max(12).optional(),
    direction: z.enum(["long", "short"]).optional(),
  }),
]);

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());

    const result =
      body.source === "headlines"
        ? await (async () => {
            const research = await fetchDeskWeekResearch();
            if (body.kind === "portfolio_thesis" && !body.symbol) {
              return { error: "symbol_required" as const };
            }
            const row = body.symbol
              ? research.symbols.find(
                  (s) => s.symbol.toUpperCase() === body.symbol!.toUpperCase()
                )
              : undefined;
            return generateDeskDraftFromHeadlines({
              kind: body.kind,
              symbols: research.symbols,
              symbol: body.symbol,
              direction: body.direction ?? row?.direction,
            });
          })()
        : await generateDeskDraft({
            kind: body.kind,
            bullets: body.bullets,
            symbol: body.symbol,
            direction: body.direction,
          });

    if ("error" in result && result.error === "symbol_required") {
      return NextResponse.json({ error: "symbol_required" }, { status: 400 });
    }
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
