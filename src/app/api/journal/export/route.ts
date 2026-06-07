import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/auth/session";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";
import {
  buildHubJournalExport,
  buildSymbolJournalExport,
} from "@/lib/journal/export-markdown";

function markdownResponse(body: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(request: Request) {
  try {
    const session = await requireActiveMember();
    if (!canAccessProIntelligence(sessionToProContext(session))) {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    const symbol = new URL(request.url).searchParams.get("symbol")?.toUpperCase().trim();

    if (symbol) {
      const markdown = await buildSymbolJournalExport(session.userId, symbol);
      if (!markdown) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return markdownResponse(markdown, `portfuel-journal-${symbol}.md`);
    }

    const markdown = await buildHubJournalExport(session.userId);
    return markdownResponse(markdown, "portfuel-journal-notebook.md");
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "subscription_inactive") {
      return NextResponse.json({ error: "subscription_inactive" }, { status: 403 });
    }
    console.error("[journal/export]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
