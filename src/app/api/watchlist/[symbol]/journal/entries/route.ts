import { NextResponse } from "next/server";
import { z } from "zod";
import { JOURNAL_ENTRY_TYPES, type JournalEntryType } from "@/lib/watchlist/journal-meta";
import { requireActiveMember } from "@/lib/auth/session";
import { addJournalEntry, fetchJournalEntries } from "@/lib/watchlist/journal";

type RouteContext = { params: Promise<{ symbol: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireActiveMember();
    const { symbol } = await context.params;
    const entries = await fetchJournalEntries(session.userId, symbol);
    return NextResponse.json({ entries });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[watchlist journal entries GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const userEntryTypes = JOURNAL_ENTRY_TYPES.map((t) => t.value) as [
  JournalEntryType,
  ...JournalEntryType[],
];

const postSchema = z.object({
  body: z.string().min(1).max(4000),
  reply_to_id: z.string().uuid().nullable().optional(),
  conviction_after: z.number().int().min(1).max(10).nullable().optional(),
  entry_type: z.enum(userEntryTypes).optional(),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireActiveMember();
    const { symbol } = await context.params;
    const parsed = postSchema.parse(await request.json());
    const result = await addJournalEntry(session.userId, symbol, parsed);
    if ("error" in result) {
      const status =
        result.error === "not_on_watchlist"
          ? 404
          : result.error === "demo_readonly"
            ? 403
            : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, entry: result.entry });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[watchlist journal entries POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
